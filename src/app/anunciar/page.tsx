'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Store,
  PhoneCall,
  X,
  HelpCircle,
  MapPin,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  supabase,
  Plan,
  Business,
  City,
  DEFAULT_PLANS,
  DEFAULT_CITIES,
  getPlans,
  getCities,
} from '@/lib/supabase';

function persistCitySelection(slug: string) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('venoapp_current_city_slug', slug);
      window.document.cookie = `venoapp_city=${slug}; path=/; max-age=31536000; SameSite=Lax`;
    }
  } catch {
    // ignore
  }
}

function AnunciarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Multi-tenant city state
  const [cities, setCities] = useState<City[]>(DEFAULT_CITIES);
  const [currentCity, setCurrentCity] = useState<City>(DEFAULT_CITIES[0]);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    companyName: '',
    category: 'Restaurantes & Gastronomia',
    contactName: '',
    whatsapp: '',
    address: '',
  });

  // Load cities and determine active city
  useEffect(() => {
    async function loadCities() {
      try {
        const list = await getCities();
        if (list && list.length > 0) {
          setCities(list);

          const paramSlug = searchParams.get('cidade') || searchParams.get('city');
          const storedSlug =
            typeof window !== 'undefined'
              ? localStorage.getItem('venoapp_current_city_slug')
              : null;
          const targetSlug = paramSlug || storedSlug || 'umuarama-pr';
          const matched = list.find((c) => c.slug === targetSlug) || list[0];
          setCurrentCity(matched);
        }
      } catch (err) {
        console.error('Erro ao carregar cidades:', err);
      }
    }
    loadCities();
  }, [searchParams]);

  // Load plans from API / Supabase in real-time
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/plans', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPlans(data);
            return;
          }
        }
        const data = await getPlans();
        if (data && data.length > 0) {
          setPlans(data);
        }
      } catch (err) {
        console.error('Erro ao carregar planos:', err);
      } finally {
        setLoadingPlans(false);
      }
    }
    load();
  }, []);

  const handleSelectCity = (cityObj: City) => {
    setCurrentCity(cityObj);
    setCityDropdownOpen(false);
    persistCitySelection(cityObj.slug);
  };

  // WhatsApp mask helper
  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 2 && raw.length <= 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    } else if (raw.length > 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    }
    setFormData((prev) => ({ ...prev, whatsapp: formatted }));
  };

  const handleOpenModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setSelectedPlan(null);
  };

  const generateSlug = (name: string) => {
    const clean = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${clean || 'empresa'}-${randomSuffix}`;
  };

  // Franchisee WhatsApp resolver
  const rawFranchisePhone = currentCity.franchisee_phone || '44997775544';
  const cleanFranchisePhone = rawFranchisePhone.replace(/\D/g, '');
  const franchiseWhatsApp = cleanFranchisePhone.startsWith('55')
    ? cleanFranchisePhone
    : `55${cleanFranchisePhone}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    if (!formData.companyName.trim() || !formData.whatsapp.trim() || !formData.address.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const cleanPhone = formData.whatsapp.replace(/\D/g, '');
      const slug = generateSlug(formData.companyName);
      const isVip = selectedPlan.slug === 'destaque-vip' || selectedPlan.slug === 'master';
      const isMaster = selectedPlan.slug === 'master';

      const payload: Partial<Business> = {
        city_id: currentCity.id,
        name: formData.companyName.trim(),
        slug,
        category: formData.category,
        address: formData.address.trim(),
        whatsapp: cleanPhone,
        phone: cleanPhone,
        plan_id: selectedPlan.id,
        subscription_status: 'active',
        is_verified: isVip,
        is_featured: isMaster,
        description: `Estabelecimento comercial em ${currentCity.name} cadastrado no plano ${selectedPlan.name}.`,
      };

      const { data: createdBusiness, error } = await supabase
        .from('businesses')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Erro ao cadastrar empresa:', error);
        throw new Error(error.message || 'Falha ao salvar no banco de dados.');
      }

      // Salva no localStorage para que o Portal do Parceiro já abra com a nova empresa
      if (createdBusiness?.id) {
        localStorage.setItem('venoapp_partner_business_id', createdBusiness.id);
        localStorage.setItem('venoapp_partner_business_name', createdBusiness.name);
      }

      // Prepara mensagem comercial direcionada para o WhatsApp do Franqueado Local
      const waMsg = encodeURIComponent(
        `Olá Franqueado Venoapp de ${currentCity.name}! Acabei de cadastrar a empresa "${formData.companyName}" no Venoapp no Plano ${selectedPlan.name} e quero ativar minha assinatura comercial.`
      );
      const waUrl = `https://wa.me/${franchiseWhatsApp}?text=${waMsg}`;

      // Abre o WhatsApp da franquia em nova aba
      window.open(waUrl, '_blank');

      // Redireciona na mesma aba para o portal do parceiro
      router.push('/portal-parceiro');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocorreu um erro ao processar seu cadastro.';
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f041c] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* ======================================================== */}
      {/* HEADER / NAVBAR DE VENDAS */}
      {/* ======================================================== */}
      <header className="bg-[#18062b]/95 backdrop-blur-md sticky top-0 z-40 border-b border-purple-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/${currentCity.slug}`} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
                <svg viewBox="0 0 36 36" fill="none" className="w-5 h-5 text-white">
                  <path
                    d="M6 8L18 30L30 8"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11 8L18 22L25 8"
                    stroke="#e9d5ff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white leading-none">
                  veno<span className="text-purple-400">app</span>
                </span>
                <span className="text-[10px] font-bold text-purple-300 tracking-wider uppercase">
                  Publicidade & Empresas
                </span>
              </div>
            </Link>

            {/* City Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-800/50 hover:border-purple-600 text-purple-200 text-xs font-semibold transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {currentCity.name} - {currentCity.state || 'PR'}
                </span>
                <ChevronDown className="w-3 h-3 text-purple-400" />
              </button>

              {cityDropdownOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-[#1b0730] border border-purple-700/60 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                    Trocar Praça / Cidade
                  </div>
                  <div className="space-y-1 mt-1">
                    {cities.map((c) => (
                      <button
                        key={c.id || c.slug}
                        type="button"
                        onClick={() => handleSelectCity(c)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                          c.slug === currentCity.slug
                            ? 'bg-purple-600 text-white font-bold'
                            : 'text-purple-200 hover:bg-purple-900/60'
                        }`}
                      >
                        <span>
                          {c.name} ({c.state || 'PR'})
                        </span>
                        {c.slug === currentCity.slug && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${currentCity.slug}`}
              className="text-xs font-semibold text-purple-200/80 hover:text-white transition px-3 py-2 rounded-xl hidden sm:inline-block"
            >
              Voltar ao Portal
            </Link>

            <Link
              href="/portal-parceiro"
              className="text-xs font-semibold text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/40 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-purple-400" />
              <span>Já sou Parceiro</span>
            </Link>

            <a
              href={`https://wa.me/${franchiseWhatsApp}?text=${encodeURIComponent(
                `Olá Franqueado de ${currentCity.name}! Gostaria de tirar dúvidas sobre os planos de publicidade do Venoapp.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/40 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Falar com Franqueado</span>
              <span className="md:hidden">WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* HERO SECTION DE ALTA CONVERSÃO */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-purple-900/30">
        <div className="absolute inset-0 bg-radial from-purple-900/30 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-600/10 blur-[130px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-900/80 to-indigo-950/80 border border-purple-700/50 px-4 py-1.5 rounded-full text-xs font-bold text-purple-200 shadow-inner animate-in fade-in duration-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Publicidade Local Inteligente em {currentCity.name} - {currentCity.state || 'PR'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Coloque sua empresa em destaque para{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
              milhares de moradores
            </span>{' '}
            de {currentCity.name}
          </h1>

          <p className="text-base sm:text-lg text-purple-200/85 max-w-3xl mx-auto leading-relaxed font-normal">
            O Venoapp é o portal oficial que conecta a população de {currentCity.name} aos melhores
            eventos, fotos e estabelecimentos locais. Tenha mais visualizações, cliques diretos no seu
            WhatsApp e clientes garantidos todos os dias.
          </p>

          {/* Value Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-4xl mx-auto">
            <div className="bg-[#1b0730]/90 border border-purple-800/40 rounded-2xl p-4 text-center">
              <div className="text-xl sm:text-2xl font-black text-white">+25.000</div>
              <div className="text-[11px] text-purple-300/80 mt-0.5">
                Acessos Mensais em {currentCity.name}
              </div>
            </div>
            <div className="bg-[#1b0730]/90 border border-purple-800/40 rounded-2xl p-4 text-center">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">100% Direto</div>
              <div className="text-[11px] text-purple-300/80 mt-0.5">Sem comissão no seu WhatsApp</div>
            </div>
            <div className="bg-[#1b0730]/90 border border-purple-800/40 rounded-2xl p-4 text-center">
              <div className="text-xl sm:text-2xl font-black text-amber-400">Cupons VIP</div>
              <div className="text-[11px] text-purple-300/80 mt-0.5">Para atrair novos clientes</div>
            </div>
            <div className="bg-[#1b0730]/90 border border-purple-800/40 rounded-2xl p-4 text-center">
              <div className="text-xl sm:text-2xl font-black text-purple-300">Em 2 Minutos</div>
              <div className="text-[11px] text-purple-300/80 mt-0.5">Ativação rápida e imediata</div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* GRID COMPARATIVO DE PREÇOS / PLANOS */}
      {/* ======================================================== */}
      <section id="planos" className="py-16 sm:py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Escolha o plano ideal para sua empresa em {currentCity.name}
            </h2>
            <p className="text-sm sm:text-base text-purple-300/80 max-w-xl mx-auto">
              Sem contratos de fidelidade abusivos. Cancele quando quiser. Resultados visíveis desde o
              primeiro dia.
            </p>
          </div>


          {loadingPlans ? (
            <div className="text-center py-16 text-purple-400 animate-pulse">
              Carregando planos disponíveis...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan) => {
                const isPopular = plan.is_popular;
                const isMaster = plan.slug === 'master';

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col justify-between rounded-3xl p-7 transition-all duration-300 ${
                      isPopular
                        ? 'bg-gradient-to-b from-[#260a45] to-[#170529] border-2 border-purple-500 shadow-2xl shadow-purple-950/70 scale-[1.03] z-10'
                        : isMaster
                        ? 'bg-[#18052d] border border-amber-500/40 hover:border-amber-400/70'
                        : 'bg-[#160527] border border-purple-900/50 hover:border-purple-700/60'
                    }`}
                  >
                    {/* Badge de Popular / Mais Escolhido */}
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-purple-600 text-white font-black text-[11px] uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                        🔥 Mais Escolhido
                      </div>
                    )}

                    {isMaster && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-600 to-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                        👑 Plano Franquia
                      </div>
                    )}

                    <div className="space-y-6">
                      {/* Plan Header */}
                      <div className="space-y-2 border-b border-purple-900/40 pb-5">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-purple-300/80 leading-relaxed min-h-[36px]">
                          {plan.slug === 'presenca' && 'Para comércios que querem ser encontrados com facilidade.'}
                          {plan.slug === 'destaque-vip' && 'O plano campeão para quem quer se destacar da concorrência.'}
                          {plan.slug === 'master' && 'Máxima exposição na cidade com banners exclusivos e topo.'}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="space-y-1">
                        <span className="text-xs text-purple-300/70 font-semibold uppercase tracking-wider">
                          Investimento Mensal
                        </span>
                        <div className="flex items-baseline gap-1 text-white">
                          <span className="text-2xl font-bold text-purple-400">R$</span>
                          <span className="text-4xl sm:text-5xl font-black tracking-tight">
                            {plan.price_monthly.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xs text-purple-300/70">/mês</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3 pt-2">
                        <span className="text-xs font-bold text-purple-200 uppercase tracking-wider block">
                          Benefícios inclusos:
                        </span>
                        <ul className="space-y-2.5 text-xs text-purple-200/90">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-snug">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="pt-8">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(plan)}
                        className={`w-full flex items-center justify-center gap-2 font-black text-sm py-3.5 px-5 rounded-2xl transition cursor-pointer shadow-lg ${
                          isPopular
                            ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-purple-950/60'
                            : isMaster
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/50'
                            : 'bg-purple-800/80 hover:bg-purple-700 text-white border border-purple-600/40'
                        }`}
                      >
                        <span>Quero Este Plano</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* SEÇÃO: COMO FUNCIONA */}
      {/* ======================================================== */}
      <section className="py-14 bg-[#140426]/70 border-y border-purple-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Como funciona o processo de ativação?
            </h2>
            <p className="text-xs sm:text-sm text-purple-300/80">
              Passo a passo transparente e simplificado para você começar a faturar mais.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[#1b0730] border border-purple-800/40 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/80 text-purple-300 flex items-center justify-center font-black text-lg border border-purple-700/50">
                1
              </div>
              <h3 className="font-bold text-white text-base">Escolha seu Plano</h3>
              <p className="text-xs text-purple-300/80 leading-relaxed">
                Selecione o plano ideal para a fase da sua empresa e clique em &ldquo;Quero Este Plano&rdquo;.
              </p>
            </div>

            <div className="bg-[#1b0730] border border-purple-800/40 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/80 text-purple-300 flex items-center justify-center font-black text-lg border border-purple-700/50">
                2
              </div>
              <h3 className="font-bold text-white text-base">Preencha os Dados</h3>
              <p className="text-xs text-purple-300/80 leading-relaxed">
                Informe o nome da sua empresa, segmento e WhatsApp para criarmos o seu perfil comercial.
              </p>
            </div>

            <div className="bg-[#1b0730] border border-purple-800/40 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/80 text-purple-300 flex items-center justify-center font-black text-lg border border-purple-700/50">
                3
              </div>
              <h3 className="font-bold text-white text-base">Ativação Imediata</h3>
              <p className="text-xs text-purple-300/80 leading-relaxed">
                Você é redirecionado ao WhatsApp comercial da franquia e ao seu Portal do Parceiro para cadastrar cupons.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* FAQ: DÚVIDAS FREQUENTES */}
      {/* ======================================================== */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Dúvidas Frequentes</h2>
            <p className="text-xs sm:text-sm text-purple-300/80">
              Tudo o que você precisa saber antes de anunciar sua marca no Venoapp.
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="bg-[#1b0730] border border-purple-900/40 rounded-2xl p-5 space-y-2">
              <h3 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                Existe taxa sobre as vendas ou comissão?
              </h3>
              <p className="text-purple-300/80 leading-relaxed pl-6">
                Não! O Venoapp não cobra nenhuma porcentagem sobre suas vendas. Todo o lucro das vendas geradas é 100% seu. O cliente clica no portal e conversa diretamente no seu WhatsApp particular.
              </p>
            </div>

            <div className="bg-[#1b0730] border border-purple-900/40 rounded-2xl p-5 space-y-2">
              <h3 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                Como funciona a cobrança da assinatura?
              </h3>
              <p className="text-purple-300/80 leading-relaxed pl-6">
                A assinatura é mensal, cobrada via PIX ou Cartão de Crédito. Após preencher o formulário, nosso suporte comercial envia a chave de ativação oficial.
              </p>
            </div>

            <div className="bg-[#1b0730] border border-purple-900/40 rounded-2xl p-5 space-y-2">
              <h3 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                Posso alterar meus dados, fotos e cupons depois?
              </h3>
              <p className="text-purple-300/80 leading-relaxed pl-6">
                Sim! Você recebe acesso completo ao Portal do Parceiro (<code className="text-purple-200">/portal-parceiro</code>), onde pode trocar telefone, fotos, descrição e criar novas ofertas promocionais sempre que desejar.
              </p>
            </div>

            <div className="bg-[#1b0730] border border-purple-900/40 rounded-2xl p-5 space-y-2">
              <h3 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                Existe período de fidelidade ou multa para cancelar?
              </h3>
              <p className="text-purple-300/80 leading-relaxed pl-6">
                Não existe fidelidade. Você pode solicitar o cancelamento a qualquer momento diretamente pelo WhatsApp da franquia sem qualquer burocracia ou multa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* FOOTER */}
      {/* ======================================================== */}
      <footer className="border-t border-purple-900/40 bg-[#0c0316] py-8 text-center text-xs text-purple-400/80 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">venoapp</span>
            <span>•</span>
            <span>{currentCity.name} - {currentCity.state || 'PR'}</span>
            <span>•</span>
            <Link href={`/${currentCity.slug}`} className="hover:text-white transition">
              Portal Principal
            </Link>
            <span>•</span>
            <Link href="/portal-parceiro" className="hover:text-white transition">
              Área do Parceiro
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Venoapp Publicidade ({currentCity.name}). Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* MODAL: FECHAMENTO RÁPIDO / CADASTRO COMERCIAL */}
      {/* ======================================================== */}
      {modalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1b0730] border border-purple-700/60 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-purple-900/40 pb-4">
              <div>
                <span className="inline-block text-[10px] font-bold bg-purple-900 text-purple-200 border border-purple-700/50 px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                  Ativação Comercial • {currentCity.name}
                </span>
                <h3 className="font-black text-xl text-white">
                  Cadastre sua empresa no {selectedPlan.name}
                </h3>
                <p className="text-xs text-purple-300/80 mt-0.5">
                  Investimento:{' '}
                  <strong className="text-emerald-400 font-bold">
                    R$ {selectedPlan.price_monthly.toFixed(2).replace('.', ',')} / mês
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                className="p-1 rounded-xl hover:bg-purple-900/50 text-purple-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="bg-rose-950/70 border border-rose-800 text-rose-200 text-xs p-3 rounded-xl">
                {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-purple-200 mb-1">
                  Nome do Estabelecimento / Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Ex: Bella Gastronomia & Pizzaria"
                  className="w-full bg-[#22093c] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-200 mb-1">
                    Segmento / Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#22093c] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="Restaurantes & Gastronomia">Restaurantes & Gastronomia</option>
                    <option value="Saúde & Beleza">Saúde & Beleza</option>
                    <option value="Moda & Acessórios">Moda & Acessórios</option>
                    <option value="Serviços & Manutenção">Serviços & Manutenção</option>
                    <option value="Automotivo">Automotivo</option>
                    <option value="Educação & Treinamentos">Educação & Cursos</option>
                    <option value="Imobiliárias & Construção">Imobiliárias & Construção</option>
                    <option value="Pet Shop & Veterinária">Pet Shop & Veterinária</option>
                    <option value="Eventos & Festas">Eventos & Festas</option>
                    <option value="Outros">Outros Comércios</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-purple-200 mb-1">
                    Nome do Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Ex: Roberto Silva"
                    className="w-full bg-[#22093c] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-200 mb-1">
                    WhatsApp Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.whatsapp}
                    onChange={handleWhatsAppChange}
                    placeholder="(44) 99999-9999"
                    maxLength={15}
                    className="w-full bg-[#22093c] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-purple-200 mb-1">
                    Endereço Completo em {currentCity.name} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Av. Principal, 100 - Centro"
                    className="w-full bg-[#22093c] border border-purple-900/60 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Informação sobre ativação comercial */}
              <div className="bg-[#140426] border border-purple-900/40 rounded-xl p-3.5 flex items-start gap-2.5 text-purple-200/90 text-[11px] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Ao enviar, seu perfil será criado no portal Venoapp {currentCity.name} e você será conectado
                  ao WhatsApp da franquia ({currentCity.franchisee_name || 'Operador Local'}) para validação e confirmação da sua assinatura.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl font-semibold text-purple-300 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Cadastrando...</span>
                  ) : (
                    <>
                      <span>Finalizar e Ativar no WhatsApp</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnunciarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f041c] text-purple-300 flex items-center justify-center text-sm font-semibold">
          Carregando planos e cidades...
        </div>
      }
    >
      <AnunciarContent />
    </Suspense>
  );
}

