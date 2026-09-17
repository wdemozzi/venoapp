'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Building2, ArrowRight, Star, MessageCircle, MapPin, Check, Globe } from 'lucide-react';
import InstagramIcon from '@/components/InstagramIcon';
import { Business as SupabaseBusiness, logBusinessEvent } from '@/lib/supabase';

interface CompanyDisplay {
  id: string;
  name: string;
  category: string;
  rating: string;
  image: string;
  whatsapp?: string | null;
  phone?: string | null;
  address?: string | null;
  instagram?: string | null;
  website?: string | null;
  logo: {
    text?: string;
    bg: string;
    textColor?: string;
    icon?: string;
  };
}

const defaultCompanies: CompanyDisplay[] = [
  {
    id: 'c6a02c9c-411a-46b0-a8bc-9c0da62006e1',
    name: 'Bella Estética',
    category: 'Estética e Beleza',
    rating: '4.9',
    image: '/assets/empresa-bella.jpg',
    whatsapp: '44999112233',
    instagram: 'bellaestetica.umuarama',
    website: 'https://bellaestetica.com.br',
    address: 'Av. Paraná, 4200 - Centro',
    logo: {
      text: 'B',
      bg: 'bg-[#5c493c]',
      textColor: 'text-[#d6c7b2]',
    },
  },
  {
    id: 'f87bbdc8-3232-4752-9590-f9b0aa3fa683',
    name: 'Sabor & Arte',
    category: 'Restaurante e Pizzaria',
    rating: '4.8',
    image: '/assets/empresa-sabor.jpg',
    whatsapp: '44998887766',
    instagram: 'saborartepizzaria',
    website: 'https://saboreartepizzaria.com.br',
    address: 'Rua Governador Ney Braga, 120',
    logo: {
      text: '🍽️',
      bg: 'bg-[#291b15]',
      textColor: 'text-amber-400',
    },
  },
  {
    id: '3',
    name: 'Auto Center Umuarama',
    category: 'Serviços Automotivos',
    rating: '4.7',
    image: '/assets/empresa-autocenter.jpg',
    whatsapp: '44997775544',
    instagram: 'autocenterumuarama',
    address: 'Av. Brasil, 3100',
    logo: {
      text: '🚗',
      bg: 'bg-[#1b2b45]',
      textColor: 'text-blue-300',
    },
  },
  {
    id: '4',
    name: 'Dra. Mariana Lopes',
    category: 'Clínica Geral',
    rating: '4.9',
    image: '/assets/empresa-mariana.jpg',
    whatsapp: '44996663322',
    instagram: 'dra.marianalopes',
    address: 'Rua Desembargador Lauro Lopes, 45',
    logo: {
      text: '🩺',
      bg: 'bg-[#ebe4ff]',
      textColor: 'text-[#7b2dc7]',
    },
  },
];

interface FeaturedCompaniesProps {
  businesses?: SupabaseBusiness[];
}

export const FeaturedCompanies: React.FC<FeaturedCompaniesProps> = ({ businesses }) => {
  const router = useRouter();
  const [clickedWhatsapp, setClickedWhatsapp] = useState<string | null>(null);

  const displayCompanies: CompanyDisplay[] = businesses && businesses.length > 0
    ? businesses.map((b) => ({
        id: String(b.id),
        name: b.name,
        category: b.category || b.description || 'Empresa Local',
        rating: b.rating ? String(b.rating) : '5.0',
        image: b.cover_url || b.logo_url || b.image_url || b.image || '/assets/empresa-bella.jpg',
        whatsapp: b.whatsapp || b.phone || null,
        phone: b.phone || b.whatsapp || null,
        address: b.address || 'Umuarama - PR',
        instagram: b.instagram || null,
        website: b.website || null,
        logo: {
          text: b.logo_text || b.name.charAt(0).toUpperCase() || 'V',
          bg: b.logo_bg || 'bg-[#5c493c]',
          textColor: b.logo_color || 'text-[#d6c7b2]',
        },
      }))
    : defaultCompanies;

  const handleWhatsAppClick = async (e: React.MouseEvent, company: CompanyDisplay) => {
    e.stopPropagation();
    e.preventDefault();

    // 1. Register analytics event in Supabase
    logBusinessEvent(company.id, 'whatsapp_click');

    // 2. Feedback animation
    setClickedWhatsapp(company.id);
    setTimeout(() => setClickedWhatsapp(null), 2000);

    // 3. Open WhatsApp link
    const cleanNumber = (company.whatsapp || '44999999999').replace(/\D/g, '');
    const phoneWithCountry = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    const text = encodeURIComponent(
      `Olá! Encontrei o perfil de ${company.name} no portal Venoapp e gostaria de mais informações.`
    );
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${text}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAddressClick = (e: React.MouseEvent, company: CompanyDisplay) => {
    e.stopPropagation();
    e.preventDefault();

    // Register analytics event in Supabase
    logBusinessEvent(company.id, 'address_click');

    const query = encodeURIComponent(`${company.name}, ${company.address || 'Umuarama - PR'}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleCardClick = (company: CompanyDisplay) => {
    logBusinessEvent(company.id, 'profile_view');
    router.push(`/empresa/${company.id}`);
  };

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="text-[#7b2dc7]">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Empresas em destaque
          </h2>
        </div>

        <a
          href="#todas-empresas"
          className="text-xs sm:text-sm font-semibold text-[#7b2dc7] hover:text-[#5e229c] flex items-center gap-1 group transition-colors"
        >
          <span>Ver todas</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      {/* Grid of Company Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {displayCompanies.map((company) => (
          <div
            key={company.id}
            onClick={() => handleCardClick(company)}
            className="group bg-white rounded-2xl overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)] border border-slate-100/90 hover:border-purple-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer"
          >
            <div>
              {/* Cover Image */}
              <div className="relative h-28 w-full overflow-hidden bg-slate-100">
                <Image
                  src={company.image}
                  alt={company.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Details Area with overlapping Logo */}
              <div className="p-3.5 pt-2 flex items-start gap-3">
                {/* Circular Logo/Avatar */}
                <Link
                  href={`/empresa/${company.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`w-9 h-9 rounded-full ${company.logo.bg} ${company.logo.textColor} flex items-center justify-center font-serif text-sm font-bold shadow-sm shrink-0 border border-white mt-0.5 hover:scale-105 transition`}
                >
                  {company.logo.text}
                </Link>

                {/* Title & Category & Rating */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/empresa/${company.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-slate-900 text-xs sm:text-[13px] leading-tight truncate group-hover:text-[#7b2dc7] transition-colors block"
                  >
                    {company.name}
                  </Link>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {company.category}
                  </p>

                  <div className="flex items-center justify-between gap-1 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-[11px] font-bold text-slate-700">
                        {company.rating}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#7b2dc7] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                      Ver perfil →
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="px-3.5 pb-3.5 pt-2 flex items-center justify-between gap-1.5 border-t border-slate-50">
              {/* Address / Location link */}
              <button
                type="button"
                onClick={(e) => handleAddressClick(e, company)}
                title={company.address || 'Ver localização no mapa'}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#7b2dc7] truncate max-w-[105px] transition cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{company.address || 'Umuarama'}</span>
              </button>

              <div className="flex items-center gap-1 shrink-0">
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

                {/* WhatsApp CTA button */}
                <button
                  type="button"
                  onClick={(e) => handleWhatsAppClick(e, company)}
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer shrink-0 ${
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
                  <span className="hidden min-[400px]:inline">WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
