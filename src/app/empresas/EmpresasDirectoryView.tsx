'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  Building2,
  Search,
  MapPin,
  Star,
  MessageCircle,
  Globe,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  Check,
  Store,
  Sparkles,
  X,
} from 'lucide-react';
import InstagramIcon from '@/components/InstagramIcon';
import { City, Business, logBusinessEvent } from '@/lib/supabase';

interface EmpresasDirectoryViewProps {
  city: City;
  allCities: City[];
  businesses: Business[];
}

export function EmpresasDirectoryView({
  city,
  allCities,
  businesses,
}: EmpresasDirectoryViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'name'>('rating');
  const [clickedWhatsapp, setClickedWhatsapp] = useState<string | null>(null);

  // Extract unique categories from businesses
  const categories = useMemo(() => {
    const cats = new Set<string>();
    businesses.forEach((b) => {
      if (b.category && b.category.trim()) {
        cats.add(b.category.trim());
      }
    });
    return Array.from(cats);
  }, [businesses]);

  // Filter and sort businesses
  const filteredBusinesses = useMemo(() => {
    return businesses
      .filter((b) => {
        const matchesCategory =
          selectedCategory === 'all' ||
          (b.category && b.category.toLowerCase().includes(selectedCategory.toLowerCase()));

        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !query ||
          b.name.toLowerCase().includes(query) ||
          (b.category && b.category.toLowerCase().includes(query)) ||
          (b.description && b.description.toLowerCase().includes(query)) ||
          (b.address && b.address.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        }
        return a.name.localeCompare(b.name);
      });
  }, [businesses, selectedCategory, searchTerm, sortBy]);

  const handleWhatsAppClick = (e: React.MouseEvent, company: Business) => {
    e.stopPropagation();
    e.preventDefault();

    logBusinessEvent(company.id, 'whatsapp_click');
    setClickedWhatsapp(company.id);
    setTimeout(() => setClickedWhatsapp(null), 2000);

    const rawNumber = (company.whatsapp || company.phone || '44999999999').replace(/\D/g, '');
    const phoneWithCountry = rawNumber.startsWith('55') ? rawNumber : `55${rawNumber}`;
    const text = encodeURIComponent(
      `Olá! Encontrei o perfil de ${company.name} no Guia Comercial do Venoapp (${city.name}) e gostaria de mais informações.`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleAddressClick = (e: React.MouseEvent, company: Business) => {
    e.stopPropagation();
    e.preventDefault();

    logBusinessEvent(company.id, 'address_click');
    const query = encodeURIComponent(`${company.name}, ${company.address || `${city.name} - ${city.state}`}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleCardClick = (companyId: string) => {
    logBusinessEvent(companyId, 'profile_view');
    router.push(`/empresa/${companyId}`);
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Navbar with City Selector */}
      <Navbar currentCity={city} allCities={allCities} />

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#22093c] via-[#2a0b49] to-[#1c0733] text-white py-10 px-4 sm:px-6 border-b border-[#3b1563]">
        <div className="max-w-[1360px] mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-purple-300/80 mb-4">
            <Link
              href={`/${city.slug}`}
              className="hover:text-white transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Início</span>
            </Link>
            <span>/</span>
            <span className="text-purple-300">{city.name}</span>
            <span>/</span>
            <span className="text-white font-medium">Guia Comercial de Empresas</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-900/70 border border-purple-700/60 text-purple-200 text-xs px-3 py-1.5 rounded-full font-bold mb-3 shadow-sm">
                <Store className="w-3.5 h-3.5 text-purple-400" />
                <span>Guia Comercial Oficial • {city.name} - {city.state || 'PR'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Empresas, Lojas & Serviços em {city.name}
              </h1>
              <p className="text-purple-200/80 text-xs sm:text-sm max-w-2xl mt-2 leading-relaxed">
                Explore os melhores estabelecimentos da sua praça. Entre em contato direto pelo WhatsApp,
                confira promoções exclusivas e rotas no mapa.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white/10 border border-white/15 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs text-purple-200">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>
                  <strong>{filteredBusinesses.length}</strong>{' '}
                  {filteredBusinesses.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
                </span>
              </div>

              <Link
                href={`/anunciar?cidade=${city.slug}`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Anunciar Empresa</span>
              </Link>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Buscar empresa por nome, segmento ou bairro em ${city.name}...`}
                className="w-full bg-[#170529]/80 border border-purple-800/60 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-purple-300/60 focus:outline-none focus:border-purple-400 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-between md:justify-start">
              <div className="flex items-center gap-1.5 text-xs text-purple-200">
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Ordenar:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'name')}
                className="bg-[#170529]/80 border border-purple-800/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="rating">Melhor Avaliação ★</option>
                <option value="name">Ordem Alfabética (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white/5 text-purple-200 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              Todas ({businesses.length})
            </button>

            {categories.map((cat) => {
              const count = businesses.filter(
                (b) => b.category && b.category.toLowerCase().includes(cat.toLowerCase())
              ).length;
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white/5 text-purple-200 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {filteredBusinesses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-md mx-auto my-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#7b2dc7] flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Nenhuma empresa encontrada</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {searchTerm
                  ? `Não encontramos resultados para "${searchTerm}" na categoria selecionada.`
                  : `Ainda não há empresas cadastradas nesta categoria para ${city.name}.`}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#7b2dc7] font-bold text-xs transition cursor-pointer"
                >
                  Limpar Filtros
                </button>
              )}
              <Link
                href={`/${city.slug}`}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Voltar ao Início
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBusinesses.map((company) => {
              const coverImg =
                company.cover_url ||
                company.logo_url ||
                company.image_url ||
                company.image ||
                '/assets/empresa-bella.jpg';

              const logoLetter =
                company.logo_text || company.name.charAt(0).toUpperCase() || 'V';

              return (
                <div
                  key={company.id}
                  onClick={() => handleCardClick(company.id)}
                  className="group bg-white rounded-2xl overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-purple-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Cover Image Container */}
                    <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                      <Image
                        src={coverImg}
                        alt={company.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                      {/* Verified Badge */}
                      {company.is_verified && (
                        <div className="absolute top-2.5 left-2.5 bg-purple-900/90 backdrop-blur-xs text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                          <Check className="w-3 h-3 text-purple-300" />
                          <span>Verificada</span>
                        </div>
                      )}

                      {/* Rating pill */}
                      <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{company.rating ? String(company.rating) : '5.0'}</span>
                      </div>
                    </div>

                    {/* Details Area with Logo */}
                    <div className="p-3.5 pt-2.5 flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${company.logo_bg || 'bg-[#5c493c]'} ${
                          company.logo_color || 'text-[#d6c7b2]'
                        } flex items-center justify-center font-serif text-base font-bold shadow-sm shrink-0 border border-white mt-0.5`}
                      >
                        {logoLetter}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm leading-snug truncate group-hover:text-[#7b2dc7] transition-colors">
                          {company.name}
                        </h3>
                        <p className="text-[11px] text-purple-700 font-medium truncate mt-0.5">
                          {company.category || 'Comércio Local'}
                        </p>
                        {company.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                            {company.description.replace(/<!--[\s\S]*?-->/g, '').trim()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-50 space-y-2">
                    {/* Address button */}
                    <button
                      type="button"
                      onClick={(e) => handleAddressClick(e, company)}
                      title={company.address || `${city.name} - ${city.state}`}
                      className="w-full flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-[#7b2dc7] truncate transition cursor-pointer text-left"
                    >
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{company.address || `${city.name} - ${city.state}`}</span>
                    </button>

                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      {/* Social shortcuts */}
                      <div className="flex items-center gap-1">
                        {company.instagram && (
                          <a
                            href={`https://instagram.com/${company.instagram.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-600 flex items-center justify-center transition hover:scale-105 border border-pink-200/60"
                            title={`Instagram: @${company.instagram.replace(/^@/, '')}`}
                          >
                            <InstagramIcon className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {company.website && (
                          <a
                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition hover:scale-105 border border-indigo-200/60"
                            title={`Site: ${company.website}`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <span className="text-[11px] font-bold text-[#7b2dc7] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 pl-1">
                          Ver perfil →
                        </span>
                      </div>

                      {/* WhatsApp Button */}
                      <button
                        type="button"
                        onClick={(e) => handleWhatsAppClick(e, company)}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer shrink-0 ${
                          clickedWhatsapp === company.id
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                        }`}
                        title="Conversar pelo WhatsApp"
                      >
                        {clickedWhatsapp === company.id ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <MessageCircle className="w-3.5 h-3.5" />
                        )}
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Commercial Banner Footer */}
        <section className="mt-12 bg-gradient-to-r from-[#22093c] to-[#3a0f64] rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg border border-purple-800/40">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="bg-purple-800/80 text-purple-200 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Divulgação Comercial em {city.name}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold">
              Tem um negócio em {city.name}? Anuncie no Venoapp
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl">
              Coloque sua empresa no topo das buscas locais, divulgue ofertas com cupons e receba
              mensagens de novos clientes direto no WhatsApp.
            </p>
          </div>

          <Link
            href={`/anunciar?cidade=${city.slug}`}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl transition shadow-lg shadow-emerald-950/40 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Ver Planos Publicitários</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-[1360px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">venoapp</span>
            <span>•</span>
            <span>{city.name} - {city.state || 'PR'}</span>
            <span>•</span>
            <Link
              href={`/anunciar?cidade=${city.slug}`}
              className="text-[#7b2dc7] hover:text-[#5e229c] hover:underline font-bold transition"
            >
              Anunciar Empresa
            </Link>
            <span>•</span>
            <Link
              href="/portal-parceiro"
              className="text-slate-600 hover:text-slate-900 hover:underline font-medium transition"
            >
              Área do Comerciante
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Venoapp {city.name}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
