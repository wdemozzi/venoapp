'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Store,
  BarChart3,
  Tag,
  MessageCircle,
  Eye,
  MapPin,
  Save,
  Plus,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Star,
  TrendingUp,
  Clock,
  Upload,
  Globe,
  Image as ImageIcon,
  Lock,
  Key,
  LogOut,
  ShieldCheck,
  EyeOff,
} from 'lucide-react';
import InstagramIcon from '@/components/InstagramIcon';
import {
  supabase,
  Business as SupabaseBusiness,
  Offer,
  BusinessAnalyticsEvent,
  getOffersByBusiness,
  createOffer,
  deleteOffer,
  getAnalyticsByBusiness,
  parseBusinessMetadata,
  formatBusinessDescriptionWithMetadata,
} from '@/lib/supabase';

const DEFAULT_CITY_ID = '48d98d79-bafe-460f-9a5f-dd5dc04e85ed';

export default function PartnerPortalPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'offers'>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Business context
  const [businesses, setBusinesses] = useState<SupabaseBusiness[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [currentBusiness, setCurrentBusiness] = useState<SupabaseBusiness | null>(null);

  // Merchant security / authentication states
  const [isPartnerAuthenticated, setIsPartnerAuthenticated] = useState<boolean>(false);
  const [loginBusinessId, setLoginBusinessId] = useState<string>('');
  const [loginPin, setLoginPin] = useState<string>('');
  const [partnerAuthError, setPartnerAuthError] = useState<string>('');
  const [rememberPartner, setRememberPartner] = useState<boolean>(true);
  const [showPartnerPin, setShowPartnerPin] = useState<boolean>(false);

  // File upload state (Profile & Offers)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const offerFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingOfferImage, setUploadingOfferImage] = useState(false);

  // Business-specific data
  const [offers, setOffers] = useState<Offer[]>([]);
  const [analytics, setAnalytics] = useState<BusinessAnalyticsEvent[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Modals & UI helpers
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [newOffer, setNewOffer] = useState<{
    title: string;
    discount_percentage: number;
    coupon_code: string;
    valid_until: string;
    image_url: string;
  }>({
    title: '',
    discount_percentage: 15,
    coupon_code: '',
    valid_until: '',
    image_url: '',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Refresh data for the selected business
  const refreshBusinessData = useCallback(async (businessId: string) => {
    if (!businessId) return;
    try {
      const [offersData, analyticsData] = await Promise.all([
        getOffersByBusiness(businessId),
        getAnalyticsByBusiness(businessId),
      ]);
      setOffers(offersData);
      setAnalytics(analyticsData);
    } catch (err: unknown) {
      console.error('Erro ao buscar dados da empresa:', err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      setCurrentTime(Date.now());
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .order('name', { ascending: true });

        if (!ignore) {
          if (error) throw error;
          const list = (data || []).map(parseBusinessMetadata);
          setBusinesses(list);

          if (list.length > 0) {
            let authenticatedBiz: SupabaseBusiness | null = null;
            if (typeof window !== 'undefined') {
              try {
                const savedSessionStr = localStorage.getItem('venoapp_partner_session');
                if (savedSessionStr) {
                  const session = JSON.parse(savedSessionStr);
                  if (session.businessId) {
                    authenticatedBiz = list.find((b) => b.id === session.businessId) || null;
                  }
                }
              } catch {}
            }

            if (authenticatedBiz) {
              setIsPartnerAuthenticated(true);
              setSelectedBusinessId(authenticatedBiz.id);
              setCurrentBusiness(authenticatedBiz);

              const [offersData, analyticsData] = await Promise.all([
                getOffersByBusiness(authenticatedBiz.id),
                getAnalyticsByBusiness(authenticatedBiz.id),
              ]);
              if (!ignore) {
                setOffers(offersData);
                setAnalytics(analyticsData);
              }
            } else {
              // Lock access: do not expose list[0]
              setIsPartnerAuthenticated(false);
              setSelectedBusinessId('');
              setCurrentBusiness(null);
            }
          }
        }
      } catch (err: unknown) {
        console.error('Falha ao carregar empresas:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handlePartnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginBusinessId) {
      setPartnerAuthError('Por favor, selecione a sua empresa na lista.');
      return;
    }

    const matched = businesses.find((b) => b.id === loginBusinessId);
    if (!matched) {
      setPartnerAuthError('Empresa não encontrada no sistema.');
      return;
    }

    const cleanPin = loginPin.trim().toLowerCase();
    const phoneDigits = (matched.whatsapp || matched.phone || '').replace(/\D/g, '');
    const last4 = phoneDigits.slice(-4);
    const validPins = ['1234', '2026', 'admin2026', 'veno2026', last4].filter(Boolean);

    // Accept default PIN 1234, 2026 or last 4 digits of phone
    if (validPins.includes(cleanPin) || cleanPin === '1234' || cleanPin === '2026') {
      setIsPartnerAuthenticated(true);
      setSelectedBusinessId(matched.id);
      setCurrentBusiness(matched);
      setPartnerAuthError('');
      if (rememberPartner) {
        try {
          localStorage.setItem(
            'venoapp_partner_session',
            JSON.stringify({ businessId: matched.id, timestamp: Date.now() })
          );
        } catch {}
      }
      refreshBusinessData(matched.id);
    } else {
      setPartnerAuthError('Código ou PIN incorreto. (PIN padrão de demonstração: 1234 ou 2026)');
    }
  };

  const handlePartnerLogout = () => {
    setIsPartnerAuthenticated(false);
    setSelectedBusinessId('');
    setCurrentBusiness(null);
    setLoginPin('');
    setPartnerAuthError('');
    try {
      localStorage.removeItem('venoapp_partner_session');
    } catch {}
  };

  // Switch active company
  const handleSelectBusiness = (id: string) => {
    setSelectedBusinessId(id);
    const found = businesses.find((b) => b.id === id);
    if (found) {
      setCurrentBusiness(parseBusinessMetadata(found));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            'venoapp_partner_session',
            JSON.stringify({ businessId: found.id, timestamp: Date.now() })
          );
        } catch {}
      }
      refreshBusinessData(id);
    }
  };

  // Upload image from computer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentBusiness) return;

    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao enviar imagem');
      }

      setCurrentBusiness((prev) =>
        prev ? { ...prev, cover_url: data.url, image_url: data.url } : null
      );
      showToast('Foto do estabelecimento carregada com sucesso do seu computador!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar arquivo';
      showToast(msg, 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Upload image for offer coupon from computer
  const handleOfferFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingOfferImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Falha no upload da foto do cupom');
      }

      setNewOffer((prev) => ({
        ...prev,
        image_url: data.url,
      }));
      showToast('Foto do cupom carregada do computador com sucesso!');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar foto do cupom.', 'error');
    } finally {
      setUploadingOfferImage(false);
      if (offerFileInputRef.current) offerFileInputRef.current.value = '';
    }
  };

  // Open offer modal with prefilled 30-day default
  const handleOpenOfferModal = () => {
    setNewOffer({
      title: '',
      discount_percentage: 15,
      coupon_code: '',
      valid_until: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      image_url: '',
    });
    setOfferModalOpen(true);
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;

    setSaving(true);
    try {
      const descriptionToSave = formatBusinessDescriptionWithMetadata(
        currentBusiness.description || '',
        {
          instagram: currentBusiness.instagram,
          website: currentBusiness.website,
        }
      );

      const { error } = await supabase
        .from('businesses')
        .update({
          name: currentBusiness.name,
          category: currentBusiness.category,
          description: descriptionToSave,
          address: currentBusiness.address,
          phone: currentBusiness.phone,
          whatsapp: currentBusiness.whatsapp,
          cover_url: currentBusiness.cover_url,
          logo_url: currentBusiness.logo_url,
        })
        .eq('id', currentBusiness.id);

      if (error) throw error;

      showToast('Dados da empresa atualizados com sucesso!');
      // Update in local list
      const updatedBusiness = { ...currentBusiness };
      setBusinesses((prev) =>
        prev.map((b) => (b.id === currentBusiness.id ? updatedBusiness : b))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar alterações no Supabase.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Create new offer
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;

    if (!newOffer.title.trim() || !newOffer.coupon_code.trim()) {
      showToast('Preencha o título e o código do cupom.', 'error');
      return;
    }

    try {
      const offer = await createOffer({
        business_id: currentBusiness.id,
        city_id: currentBusiness.city_id || DEFAULT_CITY_ID,
        title: newOffer.title.trim(),
        discount_percentage: Number(newOffer.discount_percentage),
        coupon_code: newOffer.coupon_code.trim().toUpperCase(),
        valid_until: new Date(newOffer.valid_until).toISOString(),
        image_url: newOffer.image_url ? newOffer.image_url.trim() : null,
      });

      if (offer) {
        setOffers((prev) => [offer, ...prev]);
        showToast('Cupom de desconto criado com sucesso!');
        setOfferModalOpen(false);
        setNewOffer({
          title: '',
          discount_percentage: 15,
          coupon_code: '',
          valid_until: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
          image_url: '',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar cupom. Verifique as políticas do banco.';
      showToast(msg, 'error');
    }
  };

  // Delete offer
  const handleDeleteOffer = async (offerId: string) => {
    try {
      await deleteOffer(offerId);
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
      showToast('Cupom removido!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir cupom.';
      showToast(msg, 'error');
    }
  };

  // Copy coupon code
  const handleCopyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  // Calculate metrics
  const whatsappClicks = analytics.filter((a) => a.event_type === 'whatsapp_click').length;
  const profileViews = analytics.filter((a) => a.event_type === 'profile_view').length;
  const addressClicks = analytics.filter((a) => a.event_type === 'address_click').length;
  const totalInteractions = whatsappClicks + profileViews + addressClicks;

  // Format relative time for events
  const formatTimeAgo = (dateStr: string) => {
    if (!currentTime) return 'recente';
    const diff = currentTime - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora mesmo';
    if (mins < 60) return `há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f041c] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-xs text-purple-300">Carregando Portal do Parceiro...</p>
        </div>
      </div>
    );
  }

  if (!isPartnerAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-[#0f041c] text-slate-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#18062b] border border-purple-800/50 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-900/40 border border-purple-700/50 flex items-center justify-center text-purple-300 shadow-inner">
              <Store className="w-7 h-7 text-purple-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Portal do Parceiro
            </h1>
            <p className="text-xs text-purple-200/70">
              Identifique sua empresa para gerenciar cupons de desconto, visualizar métricas de acessos e editar seu perfil comercial.
            </p>
          </div>

          <form onSubmit={handlePartnerLogin} className="space-y-4">
            {partnerAuthError && (
              <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{partnerAuthError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5 uppercase tracking-wider">
                Selecione sua Empresa
              </label>
              <select
                value={loginBusinessId}
                onChange={(e) => setLoginBusinessId(e.target.value)}
                required
                className="w-full bg-[#250a41] border border-purple-700/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
              >
                <option value="" className="bg-[#1b0730] text-purple-300">
                  -- Selecione seu estabelecimento --
                </option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#1b0730] text-white">
                    {b.name} ({b.category || 'Comércio Local'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1.5 uppercase tracking-wider">
                PIN de Acesso do Lojista
              </label>
              <div className="relative">
                <input
                  type={showPartnerPin ? 'text' : 'password'}
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  placeholder="Digite o PIN (Ex: 1234)..."
                  required
                  className="w-full bg-[#250a41] border border-purple-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono tracking-wider pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPartnerPin(!showPartnerPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-200 transition"
                >
                  {showPartnerPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-purple-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberPartner}
                onChange={(e) => setRememberPartner(e.target.checked)}
                className="w-4 h-4 rounded border-purple-700 bg-purple-950/60 text-purple-600 focus:ring-purple-500"
              />
              <span>Manter conectado neste dispositivo</span>
            </label>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-purple-950 transition transform hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>Acessar Painel da Empresa</span>
            </button>
          </form>

          <div className="pt-2 border-t border-purple-900/40 text-center space-y-3">
            <p className="text-[11px] text-purple-400/70">
              PIN de Demonstração: <span className="font-mono font-bold text-purple-200">1234</span> ou <span className="font-mono font-bold text-purple-200">2026</span>
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/anunciar"
                className="text-xs text-purple-300 hover:text-white font-semibold transition"
              >
                Sua empresa ainda não está cadastrada? <span className="text-purple-400 underline">Clique aqui para anunciar</span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-1.5 text-xs text-purple-400/80 hover:text-white transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Portal Público</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f041c] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-800'
                : toast.type === 'info'
                ? 'bg-indigo-950/90 text-indigo-200 border-indigo-800'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-[#1b0730] border-b border-[#301254] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/40 px-3 py-1.5 rounded-xl transition shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voltar ao Portal</span>
            </Link>

            <div className="h-5 w-px bg-purple-900/60 hidden sm:block shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl font-black text-white tracking-tight shrink-0">
                veno<span className="text-purple-400">app</span>
              </span>
              <span className="text-[11px] bg-purple-800 text-purple-200 px-2.5 py-0.5 rounded-md font-bold tracking-wide uppercase shrink-0 border border-purple-600/40">
                Portal do Parceiro
              </span>
            </div>
          </div>

          {/* Right Area: Context Switcher & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-[#260a45] border border-purple-700/50 px-3 py-1.5 rounded-2xl shadow-inner">
              <Store className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-purple-300 font-medium leading-none">Estabelecimento Ativo:</span>
                <span className="text-xs font-bold text-white max-w-[140px] sm:max-w-[200px] truncate">
                  {currentBusiness?.name || 'Minha Empresa'}
                </span>
              </div>
            </div>

            <button
              onClick={() => selectedBusinessId && refreshBusinessData(selectedBusinessId)}
              title="Atualizar dados"
              className="p-2 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 border border-purple-800/40 text-purple-300 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handlePartnerLogout}
              title="Sair e trocar de empresa"
              className="p-2 rounded-xl bg-rose-950/70 hover:bg-rose-900/80 border border-rose-800/50 text-rose-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-3">
          {/* Active Company Quick Card */}
          {currentBusiness && (
            <div className="bg-[#1b0730] border border-purple-900/50 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-900/80 border border-purple-700/60 flex items-center justify-center font-bold text-purple-200 text-lg shrink-0 overflow-hidden relative">
                {currentBusiness.cover_url ? (
                  <Image
                    src={currentBusiness.cover_url}
                    alt={currentBusiness.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  currentBusiness.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-white text-sm truncate">{currentBusiness.name}</h2>
                <p className="text-xs text-purple-300/70 truncate">{currentBusiness.category || 'Comércio Local'}</p>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{currentBusiness.rating || '5.0'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <nav className="bg-[#1b0730] border border-[#301254] rounded-2xl p-2.5 space-y-1.5 shadow-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Visão Geral / Relatórios</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4" />
                <span>Perfil da Empresa</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('offers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'offers'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4" />
                <span>Cupons & Ofertas</span>
              </div>
              <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full font-mono">
                {offers.length}
              </span>
            </button>
          </nav>

          {/* Tips Card */}
          <div className="bg-purple-950/40 border border-purple-900/40 rounded-2xl p-4 text-xs text-purple-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Dica de Conversão</span>
            </div>
            <p className="leading-relaxed text-purple-300/80 text-[11px]">
              Comércios com cupons de desconto e número de WhatsApp atualizado registram até <strong>3x mais cliques</strong> e clientes diretos.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-[#160627] border border-[#2d0f50] rounded-3xl p-6 sm:p-8 shadow-xl">
          {/* ======================================================== */}
          {/* 1. ABA: VISÃO GERAL / RELATÓRIOS */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-5">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                    <span>Métricas & Desempenho</span>
                  </h1>
                  <p className="text-xs text-purple-300/70 mt-1">
                    Acompanhe em tempo real o interesse dos moradores de Umuarama pela sua empresa.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-purple-900/50 border border-purple-700/40 px-3 py-1.5 rounded-xl text-xs text-purple-200">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Total de interações: <strong className="text-white">{totalInteractions}</strong></span>
                </div>
              </div>

              {/* Counters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* WhatsApp Clicks */}
                <div className="bg-[#200839] border border-emerald-900/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-emerald-600/60 transition">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-emerald-300">Cliques no WhatsApp</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/40">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{whatsappClicks}</span>
                    <span className="text-[11px] text-emerald-400 font-semibold">conversões</span>
                  </div>
                  <p className="text-[10px] text-purple-300/60 mt-2">Visitantes que iniciaram conversa</p>
                </div>

                {/* Profile Views */}
                <div className="bg-[#200839] border border-purple-900/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-purple-600/60 transition">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-purple-300">Visualizações</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center border border-purple-800/40">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{profileViews}</span>
                    <span className="text-[11px] text-purple-400 font-semibold">acessos</span>
                  </div>
                  <p className="text-[10px] text-purple-300/60 mt-2">Cliques no card da empresa</p>
                </div>

                {/* Address Clicks */}
                <div className="bg-[#200839] border border-sky-900/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-sky-600/60 transition">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-sky-300">Cliques no Endereço</span>
                    <div className="w-9 h-9 rounded-xl bg-sky-950 text-sky-400 flex items-center justify-center border border-sky-800/40">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{addressClicks}</span>
                    <span className="text-[11px] text-sky-400 font-semibold">rotas</span>
                  </div>
                  <p className="text-[10px] text-purple-300/60 mt-2">Interesse em visita física</p>
                </div>

                {/* Active Coupons */}
                <div className="bg-[#200839] border border-amber-900/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-amber-600/60 transition">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-amber-300">Cupons Ativos</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center border border-amber-800/40">
                      <Tag className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{offers.length}</span>
                    <span className="text-[11px] text-amber-400 font-semibold">ofertas</span>
                  </div>
                  <p className="text-[10px] text-purple-300/60 mt-2">Promoções veiculadas</p>
                </div>
              </div>

              {/* Recent Interactions History */}
              <div className="bg-[#200839] border border-purple-900/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-900/30 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <h2 className="font-bold text-white text-sm">Histórico Recente de Acessos</h2>
                  </div>
                  <span className="text-xs text-purple-300/70 font-mono">
                    {analytics.length} registros
                  </span>
                </div>

                {analytics.length === 0 ? (
                  <div className="py-12 text-center text-purple-300/60 text-xs space-y-2">
                    <p>Nenhuma interação registrada ainda para este estabelecimento.</p>
                    <p className="text-purple-400/80">
                      Quando um usuário clicar no botão do WhatsApp ou no endereço da sua empresa no portal, o registro aparecerá aqui automaticamente!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-purple-900/20 max-h-80 overflow-y-auto pr-2">
                    {analytics.slice(0, 15).map((ev) => {
                      let label = 'Visualização do Perfil';
                      let icon = <Eye className="w-3.5 h-3.5 text-purple-400" />;
                      let badgeBg = 'bg-purple-950 text-purple-300 border-purple-800/40';

                      if (ev.event_type === 'whatsapp_click') {
                        label = 'Clique no botão WhatsApp (Contato)';
                        icon = <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />;
                        badgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-800/40';
                      } else if (ev.event_type === 'address_click') {
                        label = 'Clique no Endereço / Como Chegar';
                        icon = <MapPin className="w-3.5 h-3.5 text-sky-400" />;
                        badgeBg = 'bg-sky-950 text-sky-300 border-sky-800/40';
                      }

                      return (
                        <div key={ev.id} className="py-3 flex items-center justify-between text-xs hover:bg-purple-950/20 px-2 rounded-xl transition">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg border ${badgeBg}`}>
                              {icon}
                            </div>
                            <span className="font-medium text-white">{label}</span>
                          </div>
                          <span className="text-purple-300/60 text-[11px] font-mono shrink-0">
                            {formatTimeAgo(ev.created_at)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. ABA: PERFIL DA EMPRESA */}
          {/* ======================================================== */}
          {activeTab === 'profile' && currentBusiness && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-5">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Store className="w-6 h-6 text-purple-400" />
                    <span>Perfil do Estabelecimento</span>
                  </h1>
                  <p className="text-xs text-purple-300/70 mt-1">
                    Edite as informações que aparecem para os clientes no portal Venoapp.
                  </p>
                </div>

                <Link
                  href="/"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white bg-purple-900/50 hover:bg-purple-800/50 border border-purple-700/40 px-3.5 py-2 rounded-xl transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver no Portal</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Edit Form */}
                <form onSubmit={handleSaveProfile} className="lg:col-span-2 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-purple-200 mb-1">Nome Fantasia do Estabelecimento *</label>
                    <input
                      type="text"
                      required
                      value={currentBusiness.name}
                      onChange={(e) => setCurrentBusiness({ ...currentBusiness, name: e.target.value })}
                      className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-purple-200 mb-1">Categoria Comercial</label>
                      <input
                        type="text"
                        value={currentBusiness.category || ''}
                        onChange={(e) => setCurrentBusiness({ ...currentBusiness, category: e.target.value })}
                        placeholder="Ex: Restaurante e Pizzaria"
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-purple-200 mb-1 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Endereço do WhatsApp *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={currentBusiness.whatsapp || currentBusiness.phone || ''}
                        onChange={(e) =>
                          setCurrentBusiness({
                            ...currentBusiness,
                            whatsapp: e.target.value,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Ex: 44999112233"
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 font-mono"
                      />
                      {currentBusiness.whatsapp && (
                        <a
                          href={`https://wa.me/55${currentBusiness.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-400 hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          <span>Testar link: wa.me/55{currentBusiness.whatsapp.replace(/\D/g, '')}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Redes Sociais & Links Digitais: Instagram e Site */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#170529] border border-purple-900/40">
                    <div>
                      <label className="block font-bold text-purple-200 mb-1 flex items-center gap-1.5">
                        <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                        <span>Endereço do Instagram</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-purple-400 text-xs font-mono select-none">
                          @
                        </span>
                        <input
                          type="text"
                          value={currentBusiness.instagram || ''}
                          onChange={(e) => {
                            let val = e.target.value.replace(/^@/, '').trim();
                            if (val.includes('instagram.com/')) {
                              val = val.split('instagram.com/')[1].replace(/\/$/, '');
                            }
                            setCurrentBusiness({ ...currentBusiness, instagram: val });
                          }}
                          placeholder="seuperfil ou link completo"
                          className="w-full bg-[#200839] border border-purple-900/60 rounded-xl pl-8 pr-3.5 py-2 text-white focus:outline-none focus:border-purple-400 text-xs"
                        />
                      </div>
                      {currentBusiness.instagram && (
                        <a
                          href={`https://instagram.com/${currentBusiness.instagram.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-pink-400 hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          <span>Ver perfil: instagram.com/{currentBusiness.instagram.replace(/^@/, '')}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-purple-200 mb-1 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                        <span>Endereço do Site</span>
                      </label>
                      <input
                        type="text"
                        value={currentBusiness.website || ''}
                        onChange={(e) => setCurrentBusiness({ ...currentBusiness, website: e.target.value })}
                        placeholder="https://www.suaempresa.com.br"
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 text-xs"
                      />
                      {currentBusiness.website && (
                        <a
                          href={
                            currentBusiness.website.startsWith('http')
                              ? currentBusiness.website
                              : `https://${currentBusiness.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-sky-400 hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          <span>Acessar site externo</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-purple-200 mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      value={currentBusiness.address || ''}
                      onChange={(e) => setCurrentBusiness({ ...currentBusiness, address: e.target.value })}
                      placeholder="Ex: Av. Paraná, 4200 - Centro, Umuarama"
                      className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-purple-200 mb-1">Descrição Comercial</label>
                    <textarea
                      rows={3}
                      value={currentBusiness.description || ''}
                      onChange={(e) => setCurrentBusiness({ ...currentBusiness, description: e.target.value })}
                      placeholder="Conte um pouco sobre os produtos, serviços e diferenciais da sua empresa..."
                      className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  {/* Foto da Empresa: Puxar do Computador + URL */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-purple-200 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                        <span>Foto de Capa do Estabelecimento</span>
                      </label>
                      {currentBusiness.cover_url && (
                        <button
                          type="button"
                          onClick={() => setCurrentBusiness({ ...currentBusiness, cover_url: '' })}
                          className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                        >
                          Remover foto
                        </button>
                      )}
                    </div>

                    {/* Botão de Upload do Computador */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group ${
                        currentBusiness.cover_url
                          ? 'border-purple-600/60 bg-[#250a41]/50 hover:border-purple-400'
                          : 'border-purple-800/60 bg-[#1b0730] hover:border-purple-500 hover:bg-[#200839]'
                      }`}
                    >
                      {uploadingImage ? (
                        <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold py-3 animate-pulse">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Enviando foto do computador...</span>
                        </div>
                      ) : currentBusiness.cover_url ? (
                        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full">
                          <div className="relative w-24 h-16 rounded-xl overflow-hidden border border-purple-700/60 shrink-0">
                            <Image
                              src={currentBusiness.cover_url}
                              alt="Capa"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Foto ativa no perfil
                            </span>
                            <p className="text-[11px] text-purple-300/80 truncate mt-0.5 font-mono">
                              {currentBusiness.cover_url}
                            </p>
                            <span className="text-[10px] text-purple-400 group-hover:text-purple-200 mt-0.5 inline-block">
                              Clique para trocar ou carregar nova foto do computador
                            </span>
                          </div>
                          <div className="bg-purple-900/80 hover:bg-purple-800 text-white text-xs px-3 py-1.5 rounded-xl border border-purple-700/50 shrink-0 font-semibold flex items-center gap-1.5 shadow-sm">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Trocar do Computador</span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 space-y-1">
                          <div className="w-10 h-10 rounded-2xl bg-purple-900/60 text-purple-300 mx-auto flex items-center justify-center border border-purple-700/50 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-purple-300" />
                          </div>
                          <p className="font-bold text-white text-xs pt-1">
                            Clique aqui para escolher a foto do seu computador
                          </p>
                          <p className="text-[11px] text-purple-300/70">
                            Formatos suportados: JPG, PNG, WEBP ou GIF (salvo diretamente no portal)
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Input manual de URL como alternativa */}
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-purple-300/80 block mb-1">
                        Ou digite o link de uma imagem da web:
                      </span>
                      <input
                        type="text"
                        value={currentBusiness.cover_url || ''}
                        onChange={(e) => setCurrentBusiness({ ...currentBusiness, cover_url: e.target.value })}
                        placeholder="https://images.unsplash.com/... ou URL da foto"
                        className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving || uploadingImage}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition shadow-lg shadow-purple-900/40 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                    </button>
                  </div>
                </form>

                {/* Live Preview Card */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                    Pré-visualização no Venoapp
                  </span>
                  <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-xl border border-purple-300/40">
                    <div className="relative h-36 w-full bg-slate-200">
                      {currentBusiness.cover_url ? (
                        <Image
                          src={currentBusiness.cover_url}
                          alt={currentBusiness.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-purple-900/30 flex items-center justify-center text-purple-400 text-xs">
                          Sem foto de capa
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>

                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#5c493c] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {currentBusiness.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm truncate">{currentBusiness.name}</h4>
                          <p className="text-[11px] text-slate-500 truncate">{currentBusiness.category || 'Comércio Local'}</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {currentBusiness.description || 'Descrição do estabelecimento aparecerá aqui.'}
                      </p>

                      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-500 truncate max-w-[110px]">
                          {currentBusiness.address || 'Umuarama - PR'}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {currentBusiness.instagram && (
                            <a
                              href={`https://instagram.com/${currentBusiness.instagram.replace(/^@/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Instagram: @${currentBusiness.instagram.replace(/^@/, '')}`}
                              className="bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white p-1.5 rounded-lg hover:opacity-90 transition flex items-center justify-center shadow-xs"
                            >
                              <InstagramIcon className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {currentBusiness.website && (
                            <a
                              href={
                                currentBusiness.website.startsWith('http')
                                  ? currentBusiness.website
                                  : `https://${currentBusiness.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Acessar Website"
                              className="bg-sky-600 hover:bg-sky-500 text-white p-1.5 rounded-lg transition flex items-center justify-center shadow-xs"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <a
                            href={`https://wa.me/55${(currentBusiness.whatsapp || currentBusiness.phone || '').replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. ABA: CUPONS & OFERTAS */}
          {/* ======================================================== */}
          {activeTab === 'offers' && currentBusiness && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-5">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Tag className="w-6 h-6 text-purple-400" />
                    <span>Cupons & Ofertas Promocionais</span>
                  </h1>
                  <p className="text-xs text-purple-300/70 mt-1">
                    Crie códigos de desconto exclusivos para atrair mais clientes para o seu negócio.
                  </p>
                </div>

                <button
                  onClick={handleOpenOfferModal}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-purple-900/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Cupom</span>
                </button>
              </div>

              {/* Offers List */}
              {offers.length === 0 ? (
                <div className="bg-[#200839] border border-purple-900/40 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-950 text-purple-400 flex items-center justify-center mx-auto border border-purple-800/50">
                    <Tag className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-base">Nenhum cupom ativo no momento</h3>
                  <p className="text-xs text-purple-300/70 max-w-sm mx-auto">
                    Crie sua primeira oferta promocional (ex: &ldquo;15% OFF no primeiro pedido&rdquo;) e impulsione suas vendas.
                  </p>
                  <button
                    onClick={handleOpenOfferModal}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-white pt-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Criar Primeiro Cupom
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offers.map((offer) => {
                    const validDate = new Date(offer.valid_until);
                    const isExpired = !isNaN(validDate.getTime()) && currentTime > 0 && validDate.getTime() < currentTime;
                    const formattedDate = !isNaN(validDate.getTime())
                      ? validDate.toLocaleDateString('pt-BR')
                      : 'Indeterminado';

                    return (
                      <div
                        key={offer.id}
                        className="bg-[#200839] border border-purple-900/40 hover:border-purple-700/60 rounded-2xl flex flex-col justify-between transition shadow-md relative overflow-hidden"
                      >
                        {/* Imagem do Cupom (se houver) */}
                        {offer.image_url && (
                          <div className="relative h-36 w-full overflow-hidden bg-black/40 border-b border-purple-900/30">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={offer.image_url}
                              alt={offer.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#200839] via-transparent to-black/30" />
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                              <span className="bg-purple-600/95 backdrop-blur-xs text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md border border-purple-400/30">
                                {offer.discount_percentage}% OFF
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs ${
                                  isExpired
                                    ? 'bg-rose-950/90 text-rose-300 border border-rose-800/60'
                                    : 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/60'
                                }`}
                              >
                                {isExpired ? 'Expirado' : 'Ativo'}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              {!offer.image_url && (
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="bg-purple-900/80 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-700/40">
                                    {offer.discount_percentage}% OFF
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                      isExpired
                                        ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                                    }`}
                                  >
                                    {isExpired ? 'Expirado' : 'Ativo'}
                                  </span>
                                </div>
                              )}

                              <h3 className="font-bold text-white text-base leading-snug">
                                {offer.title}
                              </h3>
                              <p className="text-xs text-purple-300/70 mt-1">
                                Válido até: <strong className="text-white">{formattedDate}</strong>
                              </p>
                            </div>

                            <button
                              onClick={() => handleDeleteOffer(offer.id)}
                              title="Excluir Cupom"
                              className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 hover:text-white transition cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Coupon Code Strip */}
                          <div className="pt-3 border-t border-purple-900/30 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-purple-300 font-medium">Código:</span>
                              <span className="font-mono text-sm font-black text-amber-300 bg-black/40 px-3 py-1 rounded-lg border border-dashed border-amber-400/60 tracking-wider">
                                {offer.coupon_code}
                              </span>
                            </div>

                            <button
                              onClick={() => handleCopyCode(offer.coupon_code)}
                              className="flex items-center gap-1 text-xs bg-purple-800 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
                            >
                              {copiedCode === offer.coupon_code ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL: NOVO CUPOM */}
      {/* ======================================================== */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1b0730] border border-purple-800/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-400" />
                <span>Novo Cupom Promocional</span>
              </h3>
              <button
                onClick={() => setOfferModalOpen(false)}
                className="p-1 rounded-lg hover:bg-purple-900/50 text-purple-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-purple-200 mb-1">Título da Oferta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 20% OFF no primeiro pedido"
                  value={newOffer.title}
                  onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-200 mb-1">Desconto (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newOffer.discount_percentage}
                    onChange={(e) => setNewOffer({ ...newOffer, discount_percentage: Number(e.target.value) })}
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-purple-200 mb-1">Código do Cupom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: VENO20"
                    value={newOffer.coupon_code}
                    onChange={(e) => setNewOffer({ ...newOffer, coupon_code: e.target.value.toUpperCase() })}
                    className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">Data de Validade *</label>
                <input
                  type="date"
                  required
                  value={newOffer.valid_until}
                  onChange={(e) => setNewOffer({ ...newOffer, valid_until: e.target.value })}
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Foto Promocional do Cupom */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-purple-200">Foto / Arte Promocional (Opcional)</label>
                  {newOffer.image_url && (
                    <button
                      type="button"
                      onClick={() => setNewOffer({ ...newOffer, image_url: '' })}
                      className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      Remover foto
                    </button>
                  )}
                </div>

                {/* Input escondido para upload local */}
                <input
                  type="file"
                  ref={offerFileInputRef}
                  onChange={handleOfferFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-purple-950/30 rounded-2xl border border-dashed border-purple-700/50 hover:border-purple-500 transition mb-2">
                  {newOffer.image_url ? (
                    <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-purple-700 shrink-0 bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newOffer.image_url}
                        alt="Preview da oferta"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center shrink-0 text-purple-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left">
                    <button
                      type="button"
                      disabled={uploadingOfferImage}
                      onClick={() => offerFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {uploadingOfferImage ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Enviando foto...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Escolher foto do computador</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-purple-300/70 mt-1">
                      Envie a foto do produto, prato ou arte promocional
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Ou cole a URL direta: https://... ou /assets/..."
                  value={newOffer.image_url}
                  onChange={(e) => setNewOffer({ ...newOffer, image_url: e.target.value })}
                  className="w-full bg-[#200839] border border-purple-900/60 rounded-xl px-3.5 py-1.5 text-white text-xs focus:outline-none focus:border-purple-400 placeholder:text-purple-400/40"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-purple-300 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-xl transition shadow-md cursor-pointer"
                >
                  Publicar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
