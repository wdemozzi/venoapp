'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  Calendar,
  Search,
  MapPin,
  Clock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Ticket,
  Building2,
  Share2,
  X,
} from 'lucide-react';
import { City, Event as SupabaseEvent } from '@/lib/supabase';

interface EventosAgendaViewProps {
  city: City;
  allCities: City[];
  events: SupabaseEvent[];
}

export function EventosAgendaView({
  city,
  allCities,
  events,
}: EventosAgendaViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        ev.title.toLowerCase().includes(q) ||
        (ev.location && ev.location.toLowerCase().includes(q)) ||
        (ev.description && ev.description.toLowerCase().includes(q)) ||
        (ev.category && ev.category.toLowerCase().includes(q))
      );
    });
  }, [events, searchTerm]);

  const handleShare = (e: React.MouseEvent, ev: SupabaseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined') {
      if (navigator.share) {
        navigator.share({
          title: ev.title,
          text: `Confira o evento "${ev.title}" em ${city.name} no Venoapp!`,
          url: window.location.href,
        }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        setCopiedId(ev.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Navbar with City Selector */}
      <Navbar currentCity={city} allCities={allCities} />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-[#22093c] via-[#2a0b49] to-[#1c0733] text-white py-10 px-4 sm:px-6 border-b border-[#3b1563]">
        <div className="max-w-[1360px] mx-auto">
          {/* Breadcrumb */}
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
            <span className="text-white font-medium">Agenda de Eventos</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-900/70 border border-purple-700/60 text-purple-200 text-xs px-3 py-1.5 rounded-full font-bold mb-3 shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Programação Oficial • {city.name} - {city.state || 'PR'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Agenda de Eventos & Shows em {city.name}
              </h1>
              <p className="text-purple-200/80 text-xs sm:text-sm max-w-2xl mt-2 leading-relaxed">
                Descubra os principais shows, feiras, festivais gastronômicos e atrações culturais
                acontecendo em {city.name}.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white/10 border border-white/15 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs text-purple-200">
                <Ticket className="w-4 h-4 text-purple-400" />
                <span>
                  <strong>{filteredEvents.length}</strong>{' '}
                  {filteredEvents.length === 1 ? 'evento agendado' : 'eventos agendados'}
                </span>
              </div>

              <Link
                href="/portal-parceiro"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Divulgar Evento</span>
              </Link>
            </div>
          </div>

          {/* Search Input */}
          <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Buscar eventos, shows ou locais em ${city.name}...`}
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
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <main className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-md mx-auto my-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#7b2dc7] flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Nenhum evento encontrado</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {searchTerm
                  ? `Não encontramos resultados para "${searchTerm}".`
                  : `Em breve novos eventos serão adicionados à agenda de ${city.name}.`}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#7b2dc7] font-bold text-xs transition cursor-pointer"
                >
                  Limpar Busca
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredEvents.map((ev) => {
              const dateObj = new Date(ev.start_date || Date.now());
              const day = dateObj.getDate();
              const month = dateObj.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();

              const coverImg =
                ev.image_url ||
                (ev as unknown as { image?: string }).image ||
                '/assets/event-expo.jpg';

              const businessId = (ev as unknown as { business_id?: string }).business_id || 'parque-exposicoes';

              return (
                <div
                  key={ev.id}
                  onClick={() => router.push(`/empresa/${businessId}`)}
                  className="group bg-white rounded-3xl overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Image Container */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                      <Image
                        src={coverImg}
                        alt={ev.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                      {/* Date Badge */}
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs rounded-2xl p-2 text-center min-w-[50px] shadow-lg border border-purple-100">
                        <span className="block text-lg font-black text-purple-900 leading-none">{day}</span>
                        <span className="block text-[10px] font-bold text-[#7b2dc7] uppercase tracking-wider mt-0.5">{month}</span>
                      </div>

                      {/* Share button */}
                      <button
                        type="button"
                        onClick={(e) => handleShare(e, ev)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-xs text-white flex items-center justify-center transition shadow-md cursor-pointer"
                        title="Compartilhar evento"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Price Badge */}
                      {ev.ticket_price && (
                        <div className="absolute bottom-3 right-3 bg-emerald-600/90 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-0.5 rounded-lg shadow-sm">
                          {ev.ticket_price}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-2">
                      {ev.category && (
                        <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {ev.category}
                        </span>
                      )}

                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-[#7b2dc7] transition-colors line-clamp-2">
                        {ev.title}
                      </h3>

                      {ev.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer metadata */}
                  <div className="p-4 pt-2 border-t border-slate-50 space-y-2">
                    {ev.location && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                        <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-[11px] text-[#7b2dc7] font-semibold">
                        <Building2 className="w-3 h-3" />
                        <span>Ver local / empresa</span>
                      </div>
                      <span className="text-xs font-bold text-[#7b2dc7] group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-[1360px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">venoapp</span>
            <span>•</span>
            <span>{city.name} - {city.state || 'PR'}</span>
            <span>•</span>
            <Link href={`/anunciar?cidade=${city.slug}`} className="text-[#7b2dc7] hover:underline font-bold">
              Anunciar Empresa
            </Link>
            <span>•</span>
            <Link href="/portal-parceiro" className="text-slate-600 hover:underline font-medium">
              Área do Comerciante
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Venoapp {city.name}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
