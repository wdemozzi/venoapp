'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Tag, ArrowRight, Copy, Check, MessageCircle, Clock, Sparkles, Building2 } from 'lucide-react';
import { Offer, Business } from '@/lib/supabase';

interface FeaturedOffersProps {
  offers?: Offer[];
  businesses?: Business[];
}

export const defaultOffers: (Offer & { business_name?: string; whatsapp?: string })[] = [
  {
    id: 'off-1',
    business_id: 'c6a02c9c-411a-46b0-a8bc-9c0da62006e1',
    business_name: 'Bella Estética',
    whatsapp: '44999112233',
    title: '25% OFF em Limpeza de Pele Profunda',
    discount_percentage: 25,
    coupon_code: 'BELLA25',
    valid_until: '2026-12-31',
    image_url: '/assets/empresa-bella.jpg',
  },
  {
    id: 'off-2',
    business_id: 'f87bbdc8-3232-4752-9590-f9b0aa3fa683',
    business_name: 'Sabor & Arte Pizzaria',
    whatsapp: '44998887766',
    title: 'Borda Recheada Grátis + 15% na Pizza Família',
    discount_percentage: 15,
    coupon_code: 'SABOR15',
    valid_until: '2026-12-31',
    image_url: '/assets/empresa-sabor.jpg',
  },
  {
    id: 'off-3',
    business_id: '3',
    business_name: 'Auto Center',
    whatsapp: '44997775544',
    title: '20% OFF no Alinhamento e Balanceamento 3D',
    discount_percentage: 20,
    coupon_code: 'AUTO20',
    valid_until: '2026-12-31',
    image_url: '/assets/empresa-autocenter.jpg',
  },
];

export const FeaturedOffers: React.FC<FeaturedOffersProps> = ({ offers = [], businesses = [] }) => {
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const displayOffers = offers.length > 0
    ? offers.map((off) => {
        const b = businesses.find((bus) => bus.id === off.business_id);
        return {
          ...off,
          business_name: b?.name || 'Comércio Local',
          whatsapp: b?.whatsapp || b?.phone || null,
        };
      })
    : defaultOffers;

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  const handleClaimWhatsApp = (e: React.MouseEvent, offer: typeof displayOffers[0]) => {
    e.stopPropagation();
    const rawNumber = (offer.whatsapp || '44999999999').replace(/\D/g, '');
    const phone = rawNumber.startsWith('55') ? rawNumber : '55' + rawNumber;
    const msg = 'Olá! Vi o cupom "' + offer.coupon_code + '" com ' + offer.discount_percentage + '% OFF de ' + offer.title + ' no Venoapp e gostaria de resgatá-lo!';
    const text = encodeURIComponent(msg);
    window.open('https://wa.me/' + phone + '?text=' + text, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = (businessId: string) => {
    router.push(`/empresa/${businessId}`);
  };

  return (
    <section id="ofertas" className="scroll-mt-24">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7b2dc7] flex items-center justify-center">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Cupons & Ofertas da Cidade
              </h2>
              <span className="bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <Sparkles className="w-2.5 h-2.5" /> ECONOMIZE
              </span>
            </div>
            <p className="text-xs text-slate-500">Descontos exclusivos no comércio e serviços locais</p>
          </div>
        </div>

        <Link
          href="/portal-parceiro"
          className="text-xs sm:text-sm font-bold text-[#7b2dc7] hover:text-[#5e229c] flex items-center gap-1 group transition-colors"
        >
          <span>Anunciar oferta</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayOffers.map((offer) => {
          const validDate = new Date(offer.valid_until);
          const formattedDate = !isNaN(validDate.getTime())
            ? validDate.toLocaleDateString('pt-BR')
            : 'Por tempo limitado';

          return (
            <div
              key={offer.id}
              onClick={() => handleCardClick(offer.business_id)}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-purple-300 shadow-[0_2px_14px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              {/* Card Top: Image with Promo Badge */}
              <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                {offer.image_url ? (
                  <Image
                    src={offer.image_url}
                    alt={offer.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center text-white/40">
                    <Tag className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Floating Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="bg-[#7b2dc7] text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-md border border-purple-400/40">
                    {offer.discount_percentage}% OFF
                  </span>
                </div>

                {/* Business Name on bottom overlay - clickable to company profile */}
                <div className="absolute bottom-2 left-3 right-3 text-white">
                  <Link
                    href={`/empresa/${offer.business_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wide uppercase text-purple-200 hover:text-white drop-shadow-sm transition cursor-pointer hover:underline"
                    title={`Ver perfil de ${offer.business_name}`}
                  >
                    <Building2 className="w-3 h-3" />
                    <span>{offer.business_name} • Ver Perfil</span>
                  </Link>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <Link
                    href={`/empresa/${offer.business_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-[#7b2dc7] transition-colors block"
                  >
                    {offer.title}
                  </Link>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Válido até {formattedDate}</span>
                    </div>
                    <span className="text-[#7b2dc7] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver Empresa →
                    </span>
                  </div>
                </div>

                {/* Coupon Code Strip + WhatsApp CTA */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 bg-purple-50/60 p-1.5 rounded-xl border border-dashed border-purple-200">
                    <div className="pl-2">
                      <span className="text-[10px] text-purple-500 font-bold uppercase block -mb-0.5">CUPOM</span>
                      <span className="font-mono text-sm font-black text-purple-900 tracking-wider">
                        {offer.coupon_code}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleCopyCode(e, offer.coupon_code)}
                      className="flex items-center gap-1 text-xs bg-white hover:bg-purple-100 text-[#7b2dc7] border border-purple-200 px-2.5 py-1 rounded-lg font-bold shadow-xs transition active:scale-95 cursor-pointer"
                      title="Copiar código do cupom"
                    >
                      {copiedCode === offer.coupon_code ? (
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
                    onClick={(e) => handleClaimWhatsApp(e, offer)}
                    className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition shadow-xs cursor-pointer active:scale-98"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Resgatar no WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
