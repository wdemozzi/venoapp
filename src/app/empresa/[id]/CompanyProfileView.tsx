'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  MapPin,
  MessageCircle,
  Phone,
  Globe,
  Star,
  ShieldCheck,
  Tag,
  Calendar,
  Camera,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Clock,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import InstagramIcon from '@/components/InstagramIcon';
import type { Business, City, Offer, Event, EventAlbum } from '@/lib/supabase';
import { logBusinessEvent } from '@/lib/supabase';

interface CompanyProfileViewProps {
  company: Business;
  city: City;
  offers: Offer[];
  events: Event[];
  albums: EventAlbum[];
}

export function CompanyProfileView({
  company,
  city,
  offers,
  events,
  albums,
}: CompanyProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'sobre' | 'ofertas' | 'eventos' | 'fotos'>('sobre');
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [clickedWhatsapp, setClickedWhatsapp] = useState(false);

  const cityName = city?.name || 'Umuarama';
  const cityState = city?.state || 'PR';

  // Handle WhatsApp
  const handleWhatsApp = () => {
    logBusinessEvent(company.id, 'whatsapp_click');
    setClickedWhatsapp(true);
    setTimeout(() => setClickedWhatsapp(false), 2000);

    const cleanNumber = (company.whatsapp || company.phone || '44999999999').replace(/\D/g, '');
    const phoneWithCountry = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    const text = encodeURIComponent(
      `Olá! Encontrei o perfil de *${company.name}* no portal Venoapp (${cityName}) e gostaria de mais informações!`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  // Handle Map / Address
  const handleAddressClick = () => {
    logBusinessEvent(company.id, 'address_click');
    const query = encodeURIComponent(`${company.name}, ${company.address || `${cityName} - ${cityState}`}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Handle Copy Link / Share
  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${company.name} no Venoapp ${cityName}`,
          text: `Confira o perfil, ofertas e novidades de ${company.name} no Venoapp!`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Handle Coupon Copy
  const handleCopyCoupon = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCoupon(code);
      setTimeout(() => setCopiedCoupon(null), 2500);
    }
  };

  // Handle Coupon WhatsApp claim
  const handleClaimOffer = (offer: Offer) => {
    logBusinessEvent(company.id, 'whatsapp_click');
    const cleanNumber = (company.whatsapp || company.phone || '44999999999').replace(/\D/g, '');
    const phoneWithCountry = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    const msg = encodeURIComponent(
      `Olá! Vi o cupom de desconto *${offer.coupon_code}* (${offer.discount_percentage}% OFF - ${offer.title}) de *${company.name}* no Venoapp e gostaria de resgatá-lo!`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  const coverImage = company.cover_url || '/assets/empresa-bella.jpg';
  const logoText = company.logo_text || company.name.charAt(0).toUpperCase() || 'V';
  const logoBg = company.logo_bg || 'bg-[#7b2dc7]';
  const logoColor = company.logo_color || 'text-white';
  const ratingValue = company.rating ? String(company.rating) : '5.0';

  return (
    <div className="w-full">
      {/* Top Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <Link
              href="/"
              className="hover:text-[#7b2dc7] flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao portal</span>
            </Link>
            <span>/</span>
            <Link href={`/${city.slug}`} className="hover:text-[#7b2dc7] transition">
              {cityName}
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate">{company.name}</span>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-[#7b2dc7] hover:text-[#5e229c] font-bold px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 transition cursor-pointer shrink-0"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartilhar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Cover Banner */}
      <div className="relative h-64 sm:h-80 lg:h-96 w-full bg-slate-900 overflow-hidden">
        <Image
          src={coverImage}
          alt={`Capa de ${company.name}`}
          fill
          priority
          className="object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

        {/* Floating Verified Badge */}
        <div className="absolute top-4 right-4 sm:right-6 flex items-center gap-2">
          <span className="bg-[#7b2dc7]/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-purple-400/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Empresa Verificada</span>
          </span>
        </div>
      </div>

      {/* Main Business Profile Card Container */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 -mt-20 sm:-mt-24 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-5 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Avatar + Title + Rating */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Logo / Avatar */}
              <div className="relative">
                {company.logo_url ? (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 relative">
                    <Image
                      src={company.logo_url}
                      alt={company.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${logoBg} ${logoColor} flex items-center justify-center font-serif text-3xl font-extrabold shadow-xl border-4 border-white`}
                  >
                    {logoText}
                  </div>
                )}
                <div
                  className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow-sm"
                  title="Estabelecimento em destaque"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              {/* Company Info */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-purple-100 text-[#7b2dc7] text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {company.category || 'Empresa Local'}
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {cityName} - {cityState}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Atendimento Aberto
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                  {company.name}
                </h1>

                {/* Rating & Location preview */}
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 pt-1">
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="ml-1 text-slate-900">{ratingValue}</span>
                    <span className="text-slate-400 font-normal">(Recomendado no Venoapp)</span>
                  </div>

                  {company.address && (
                    <button
                      type="button"
                      onClick={handleAddressClick}
                      className="flex items-center gap-1 text-slate-600 hover:text-[#7b2dc7] font-medium transition cursor-pointer underline-offset-2 hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#7b2dc7]" />
                      <span>{company.address}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="w-full lg:w-auto flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
              {/* WhatsApp Button (Primary) */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-md transition active:scale-95 cursor-pointer text-white ${
                  clickedWhatsapp ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>Conversar no WhatsApp</span>
              </button>

              {/* Instagram Button */}
              {company.instagram && (
                <a
                  href={`https://instagram.com/${company.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 text-white font-bold text-sm shadow-md hover:opacity-95 transition cursor-pointer"
                  title={`@${company.instagram.replace(/^@/, '')}`}
                >
                  <InstagramIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Instagram</span>
                </a>
              )}

              {/* Website Button */}
              {company.website && (
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-sm transition cursor-pointer"
                  title="Acessar site oficial"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Site</span>
                </a>
              )}

              {/* Location Route Button */}
              <button
                type="button"
                onClick={handleAddressClick}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer"
                title="Abrir rota no Google Maps"
              >
                <MapPin className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Como Chegar</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('sobre')}
              className={`flex items-center gap-2 pb-3.5 px-3 text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'sobre'
                  ? 'border-[#7b2dc7] text-[#7b2dc7]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Sobre o Estabelecimento</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ofertas')}
              className={`flex items-center gap-2 pb-3.5 px-3 text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'ofertas'
                  ? 'border-[#7b2dc7] text-[#7b2dc7]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Cupons & Ofertas</span>
              {offers.length > 0 && (
                <span className="bg-[#7b2dc7] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {offers.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('eventos')}
              className={`flex items-center gap-2 pb-3.5 px-3 text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'eventos'
                  ? 'border-[#7b2dc7] text-[#7b2dc7]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Eventos & Programação</span>
              {events.length > 0 && (
                <span className="bg-purple-100 text-[#7b2dc7] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {events.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fotos')}
              className={`flex items-center gap-2 pb-3.5 px-3 text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'fotos'
                  ? 'border-[#7b2dc7] text-[#7b2dc7]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Fotos & Coberturas</span>
              {albums.length > 0 && (
                <span className="bg-purple-100 text-[#7b2dc7] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {albums.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Body Grid (Main column + Sidebar column) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-16">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* TAB: SOBRE */}
            {activeTab === 'sobre' && (
              <div className="space-y-6">
                {/* Description Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
                    <Info className="w-5 h-5 text-[#7b2dc7]" />
                    <h2>Apresentação da Empresa</h2>
                  </div>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                    {company.description ||
                      `${company.name} é uma referência em ${company.category || 'produtos e serviços'} em ${cityName}. Atendimento de primeira linha, qualidade comprovada e compromisso total com a satisfação dos clientes.`}
                  </p>

                  {/* Highlights Grid */}
                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7b2dc7] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Atendimento Especializado</h4>
                        <p className="text-[11px] text-slate-500">Profissionais experientes e qualificados</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Empresa Certificada</h4>
                        <p className="text-[11px] text-slate-500">Credenciada e auditada pelo Venoapp</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Star className="w-4 h-4 fill-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Avaliação Positiva</h4>
                        <p className="text-[11px] text-slate-500">Nota {ratingValue} de aprovação local</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Fácil Acesso</h4>
                        <p className="text-[11px] text-slate-500">Localização central em {cityName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Coupons teaser if active */}
                {offers.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#1b0730] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> CUPOM DISPONÍVEL
                          </span>
                        </div>
                        <h3 className="text-lg font-black">{offers[0].title}</h3>
                        <p className="text-xs text-purple-200">
                          Economize {offers[0].discount_percentage}% com o código exclusivo do Venoapp!
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('ofertas')}
                        className="bg-white text-[#7b2dc7] hover:bg-purple-50 font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-md shrink-0 cursor-pointer"
                      >
                        Ver Cupons ({offers.length})
                      </button>
                    </div>
                  </div>
                )}

                {/* Location & Map Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base sm:text-lg">
                      <MapPin className="w-5 h-5 text-[#7b2dc7]" />
                      <h2>Localização & Endereço</h2>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddressClick}
                      className="text-xs font-bold text-[#7b2dc7] hover:text-[#5e229c] flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Abrir no Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-slate-700">
                    {company.address || `Endereço central em ${cityName} - ${cityState}`}
                  </p>

                  <div className="w-full h-48 sm:h-56 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center">
                    <div className="text-center p-6 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#7b2dc7] flex items-center justify-center mx-auto shadow-sm">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">{company.name}</p>
                      <p className="text-[11px] text-slate-500">{company.address || cityName}</p>
                      <button
                        type="button"
                        onClick={handleAddressClick}
                        className="inline-flex items-center gap-1 bg-[#7b2dc7] hover:bg-[#6624a8] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
                      >
                        <span>Traçar rota no GPS</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: OFERTAS & CUPONS */}
            {activeTab === 'ofertas' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#7b2dc7]" />
                    <span>Cupons de Desconto de {company.name}</span>
                  </h2>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                    {offers.length} {offers.length === 1 ? 'oferta ativa' : 'ofertas ativas'}
                  </span>
                </div>

                {offers.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#7b2dc7] flex items-center justify-center mx-auto">
                      <Tag className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Nenhum cupom ativo no momento</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Esta empresa ainda não cadastrou promoções vigentes. Entre em contato direto pelo WhatsApp para consultar tabelas e condições especiais!
                    </p>
                    <button
                      type="button"
                      onClick={handleWhatsApp}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Consultar no WhatsApp</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {offers.map((offer) => {
                      const validDate = new Date(offer.valid_until);
                      const formattedDate = !isNaN(validDate.getTime())
                        ? validDate.toLocaleDateString('pt-BR')
                        : 'Por tempo limitado';

                      return (
                        <div
                          key={offer.id}
                          className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                        >
                          {/* Top Image */}
                          <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                            {offer.image_url ? (
                              <Image
                                src={offer.image_url}
                                alt={offer.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center text-white/40">
                                <Tag className="w-12 h-12" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                            <div className="absolute top-3 left-3">
                              <span className="bg-[#7b2dc7] text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-md border border-purple-400/40">
                                {offer.discount_percentage}% OFF
                              </span>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm leading-snug">
                                {offer.title}
                              </h3>
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                                <Clock className="w-3 h-3" />
                                <span>Válido até {formattedDate}</span>
                              </div>
                            </div>

                            {/* Coupon code strip */}
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                              <div className="flex items-center justify-between gap-2 bg-purple-50/70 p-2 rounded-xl border border-dashed border-purple-200">
                                <div>
                                  <span className="text-[9px] text-purple-500 font-bold uppercase block">CUPOM</span>
                                  <span className="font-mono text-xs font-black text-purple-900 tracking-wider">
                                    {offer.coupon_code}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleCopyCoupon(offer.coupon_code)}
                                  className="flex items-center gap-1 text-xs bg-white hover:bg-purple-100 text-[#7b2dc7] border border-purple-200 px-2.5 py-1 rounded-lg font-bold shadow-xs transition active:scale-95 cursor-pointer"
                                >
                                  {copiedCoupon === offer.coupon_code ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="text-emerald-700">Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copiar</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleClaimOffer(offer)}
                                className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-xs cursor-pointer active:scale-98"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Resgatar Cupom no WhatsApp</span>
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

            {/* TAB: EVENTOS */}
            {activeTab === 'eventos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#7b2dc7]" />
                    <span>Eventos & Programação de {company.name}</span>
                  </h2>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                    {events.length} {events.length === 1 ? 'evento' : 'eventos'}
                  </span>
                </div>

                {events.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#7b2dc7] flex items-center justify-center mx-auto">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Nenhum evento futuro agendado</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Fique atento ao portal Venoapp para ser avisado sobre novas datas, shows e encontros especiais promovidos por {company.name}.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {events.map((event) => {
                      const date = new Date(event.start_date);
                      const isValidDate = !isNaN(date.getTime());
                      const day = isValidDate ? String(date.getDate()).padStart(2, '0') : '24';
                      const month = isValidDate
                        ? date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
                        : 'ABR';

                      return (
                        <div
                          key={event.id}
                          className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                        >
                          <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                            <Image
                              src={event.banner_url || event.image || '/assets/event-expo.jpg'}
                              alt={event.title}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                            <div className="absolute top-2.5 left-2.5 bg-[#5e229c] text-white rounded-xl px-2.5 py-1 text-center shadow-md">
                              <span className="block text-sm font-extrabold">{day}</span>
                              <span className="block text-[9px] font-bold tracking-wider uppercase text-purple-200">
                                {month}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 space-y-2">
                            <span className="text-[10px] font-extrabold text-[#7b2dc7] uppercase tracking-wider block">
                              {event.category || 'EVENTO'}
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm leading-snug">
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{event.location_name || event.location || cityName}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: FOTOS & COBERTURAS */}
            {activeTab === 'fotos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#7b2dc7]" />
                    <span>Coberturas Fotográficas Relacionadas</span>
                  </h2>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                    {albums.length} {albums.length === 1 ? 'álbum' : 'álbuns'}
                  </span>
                </div>

                {albums.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#7b2dc7] flex items-center justify-center mx-auto">
                      <Camera className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Nenhuma cobertura fotográfica disponível</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      As coberturas de eventos deste estabelecimento aparecerão aqui após a realização dos eventos oficiais.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {albums.map((album) => {
                      const date = new Date(album.event_date);
                      const formattedDate = !isNaN(date.getTime())
                        ? date.toLocaleDateString('pt-BR')
                        : 'Recente';

                      return (
                        <Link
                          key={album.id}
                          href={`/fotos/${album.id}`}
                          className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                        >
                          <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                            <Image
                              src={album.cover_image_url || '/assets/event-expo.jpg'}
                              alt={album.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold shadow-md">
                              <Camera className="w-3.5 h-3.5 text-purple-300" />
                              <span>{album.photo_count || 1} fotos</span>
                            </div>

                            <div className="absolute bottom-3 left-3 bg-purple-900/90 text-purple-200 text-[11px] px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-semibold">
                              <Calendar className="w-3 h-3 text-purple-300" />
                              <span>{formattedDate}</span>
                            </div>
                          </div>

                          <div className="p-4 flex items-center justify-between gap-2">
                            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-[#7b2dc7] transition">
                              {album.title}
                            </h3>
                            <span className="text-[#7b2dc7] font-bold text-xs shrink-0 group-hover:translate-x-1 transition-transform">
                              Ver Fotos →
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Contacts & Working Hours Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7b2dc7]" />
                <span>Canais de Atendimento</span>
              </h3>

              <div className="space-y-3 text-xs text-slate-600">
                {/* WhatsApp */}
                {(company.whatsapp || company.phone) && (
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <MessageCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <span className="font-bold text-emerald-950 block">WhatsApp Comercial</span>
                      <span className="text-slate-600">{company.whatsapp || company.phone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleWhatsApp}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Abrir
                    </button>
                  </div>
                )}

                {/* Telefone fixo */}
                {company.phone && (
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <Phone className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <span className="font-bold text-slate-900 block">Telefone</span>
                      <span className="text-slate-600">{company.phone}</span>
                    </div>
                    <a
                      href={`tel:${company.phone.replace(/\D/g, '')}`}
                      className="text-[#7b2dc7] font-bold hover:underline"
                    >
                      Ligar
                    </a>
                  </div>
                )}

                {/* Instagram */}
                {company.instagram && (
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-pink-50/60 border border-pink-100">
                    <InstagramIcon className="w-4 h-4 text-pink-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <span className="font-bold text-pink-950 block">Instagram Oficial</span>
                      <span className="text-slate-600">@{company.instagram.replace(/^@/, '')}</span>
                    </div>
                    <a
                      href={`https://instagram.com/${company.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-700 font-bold hover:underline"
                    >
                      Seguir
                    </a>
                  </div>
                )}

                {/* Website */}
                {company.website && (
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                    <Globe className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-indigo-950 block">Site / Cardápio</span>
                      <span className="text-slate-600 truncate block">{company.website}</span>
                    </div>
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-700 font-bold hover:underline"
                    >
                      Acessar
                    </a>
                  </div>
                )}

                {/* Horários padronizados */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="font-bold text-slate-800 block text-xs">Horário de Funcionamento:</span>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Segunda a Sexta</span>
                    <span className="font-semibold text-slate-800">08:00 às 18:00</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Sábado</span>
                    <span className="font-semibold text-slate-800">08:00 às 12:30</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Domingo</span>
                    <span className="text-amber-600 font-semibold">Fechado ou Plantão</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Merchant Owner CTA Card */}
            <div className="bg-gradient-to-br from-[#1b0730] to-[#3a0d66] rounded-3xl p-6 text-white shadow-lg space-y-3 border border-purple-800/40">
              <span className="bg-[#7b2dc7] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ÁREA DO PARCEIRO
              </span>
              <h4 className="font-extrabold text-base leading-snug">
                Você é o proprietário de {company.name}?
              </h4>
              <p className="text-xs text-purple-200 leading-relaxed">
                Atualize informações, publique novos cupons promocionais e acompanhe os cliques no seu WhatsApp em tempo real.
              </p>
              <Link
                href="/portal-parceiro"
                className="w-full inline-flex items-center justify-center gap-1.5 bg-white hover:bg-purple-50 text-[#7b2dc7] font-bold text-xs py-2.5 rounded-xl transition shadow-xs cursor-pointer"
              >
                <span>Acessar Portal do Parceiro</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Commercial Advertising CTA */}
            <div className="bg-purple-50/80 rounded-3xl p-6 border border-purple-200/80 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7b2dc7] flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                Coloque sua empresa em destaque em {cityName}
              </h4>
              <p className="text-xs text-slate-600">
                Planos a partir de R$ 49,90/mês para divulgar seu comércio para milhares de moradores.
              </p>
              <Link
                href={`/anunciar?cidade=${city.slug}`}
                className="inline-flex items-center justify-center gap-1 bg-[#7b2dc7] hover:bg-[#6824ab] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs"
              >
                <span>Ver Planos Comerciais</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
