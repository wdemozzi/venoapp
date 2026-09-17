'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Calendar, ArrowRight, MapPin, Clock, ChevronRight, Building2 } from 'lucide-react';
import type { Event as SupabaseEvent } from '@/lib/supabase';

interface EventDisplay {
  id: string;
  business_id: string;
  day: string;
  month: string;
  category: string;
  title: string;
  location: string;
  time: string;
  image: string;
}

const defaultEvents: EventDisplay[] = [
  {
    id: '1',
    business_id: 'parque-exposicoes',
    day: '24',
    month: 'ABR',
    category: 'SHOW',
    title: 'Luan Santana em Umuarama',
    location: 'Parque de Exposições',
    time: 'Hoje • 21h00',
    image: '/assets/event-luan.jpg',
  },
  {
    id: '2',
    business_id: 'parque-exposicoes',
    day: '26',
    month: 'ABR',
    category: 'RODEIO',
    title: 'Expo Umuarama 2025',
    location: 'Parque de Exposições',
    time: '26 de abr • 20h00',
    image: '/assets/event-expo.jpg',
  },
  {
    id: '3',
    business_id: 'bda03ac2-5695-42d9-a94a-9f89984cbe2e',
    day: '02',
    month: 'MAI',
    category: 'GASTRONOMIA',
    title: 'Festival Gastronômico',
    location: 'Sabor & Arte Pizzaria',
    time: '02 a 04 de mai • 18h00',
    image: '/assets/event-gastronomia.jpg',
  },
  {
    id: '4',
    business_id: 'c6a02c9c-411a-46b0-a8bc-9c0da62006e1',
    day: '10',
    month: 'MAI',
    category: 'MÚSICA',
    title: 'Sertanejo na Praça',
    location: 'Praça Santos Dumont',
    time: '10 de mai • 19h00',
    image: '/assets/event-sertanejo.jpg',
  },
];

interface FeaturedEventsProps {
  events?: SupabaseEvent[];
}

export const FeaturedEvents: React.FC<FeaturedEventsProps> = ({ events }) => {
  const router = useRouter();

  const displayEvents: EventDisplay[] = events && events.length > 0
    ? events.map((ev) => {
        const date = new Date(ev.start_date);
        const isValidDate = !isNaN(date.getTime());
        const day = isValidDate ? String(date.getDate()).padStart(2, '0') : '24';
        const month = isValidDate
          ? date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
          : 'ABR';

        const businessId =
          (ev as { business_id?: string }).business_id ||
          (ev.location_name?.toLowerCase().includes('parque') ? 'parque-exposicoes' : 'parque-exposicoes');

        return {
          id: String(ev.id),
          business_id: businessId,
          day,
          month,
          category: ev.category || (ev.is_highlight ? 'DESTAQUE' : 'EVENTO'),
          title: ev.title,
          location: ev.location_name || ev.location || 'Umuarama - PR',
          time: ev.time || (isValidDate ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '20h00'),
          image: ev.banner_url || ev.image_url || ev.image || '/assets/event-expo.jpg',
        };
      })
    : defaultEvents;

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="text-[#7b2dc7]">
            <Calendar className="w-5 h-5" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Eventos em destaque
          </h2>
        </div>

        <a
          href="#todos-eventos"
          className="text-xs sm:text-sm font-semibold text-[#7b2dc7] hover:text-[#5e229c] flex items-center gap-1 group transition-colors"
        >
          <span>Ver todos</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      {/* Grid of Event Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {displayEvents.map((event) => (
          <div
            key={event.id}
            onClick={() => router.push(`/empresa/${event.business_id}`)}
            className="group bg-white rounded-2xl overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)] border border-slate-100/90 hover:border-purple-200 hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer"
          >
            {/* Image & Date Badge */}
            <div className="relative h-36 w-full overflow-hidden bg-slate-100">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

              {/* Date Badge */}
              <div className="absolute top-2.5 left-2.5 bg-[#5e229c] text-white rounded-xl px-2.5 py-1 text-center shadow-md leading-tight">
                <span className="block text-sm font-extrabold tracking-tight">
                  {event.day}
                </span>
                <span className="block text-[9px] font-bold tracking-wider text-purple-200 uppercase">
                  {event.month}
                </span>
              </div>

              {/* View company hint on hover */}
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                Ver Empresa →
              </div>
            </div>

            {/* Event Info */}
            <div className="p-3.5 flex flex-col flex-1 justify-between">
              <div>
                <span className="block text-[10px] font-extrabold text-[#7b2dc7] uppercase tracking-wider mb-1">
                  {event.category}
                </span>
                <Link
                  href={`/empresa/${event.business_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug line-clamp-1 group-hover:text-[#7b2dc7] transition-colors block"
                >
                  {event.title}
                </Link>
              </div>

              <div className="mt-3 flex items-end justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate group-hover:text-[#7b2dc7] transition-colors">
                    <Building2 className="w-3 h-3 text-[#7b2dc7] shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{event.time}</span>
                  </div>
                </div>

                <Link
                  href={`/empresa/${event.business_id}`}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Ver perfil da empresa"
                  className="w-7 h-7 rounded-full bg-[#f3eaff] group-hover:bg-[#7b2dc7] text-[#7b2dc7] group-hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs"
                  title="Ver perfil da empresa organizadora"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
