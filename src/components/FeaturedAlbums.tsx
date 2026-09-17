'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, ArrowRight, Calendar, User, Building2 } from 'lucide-react';
import type { EventAlbum } from '@/lib/supabase';

interface FeaturedAlbumsProps {
  albums?: EventAlbum[];
}

const defaultAlbums: (EventAlbum & { business_id?: string; venue_name?: string })[] = [
  {
    id: 'a613fa16-dcee-4f41-91f9-ddf15f49243f',
    city_id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
    business_id: 'parque-exposicoes',
    venue_name: 'Parque de Exposições',
    title: 'Cobertura Expo Umuarama - Melhores Momentos',
    cover_image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    event_date: '2026-09-16',
    photographer_name: 'Fotografia Oficial Venoapp',
    photo_count: 3,
  },
];

export const FeaturedAlbums: React.FC<FeaturedAlbumsProps> = ({ albums }) => {
  const router = useRouter();
  const rawAlbums = albums && albums.length > 0 ? albums.slice(0, 3) : defaultAlbums;

  const displayAlbums = rawAlbums.map((album) => {
    const businessId =
      (album as { business_id?: string }).business_id ||
      (album.title.toLowerCase().includes('expo') ? 'parque-exposicoes' : 'parque-exposicoes');
    const venueName =
      (album as { venue_name?: string }).venue_name ||
      (album.title.toLowerCase().includes('expo') ? 'Parque de Exposições' : 'Estabelecimento Parceiro');

    return {
      ...album,
      business_id: businessId,
      venue_name: venueName,
    };
  });

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="text-[#7b2dc7]">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Últimas Coberturas Fotográficas
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              Reviva os melhores momentos dos eventos da cidade
            </p>
          </div>
        </div>

        <Link
          href="/fotos"
          className="text-xs sm:text-sm font-semibold text-[#7b2dc7] hover:text-[#5e229c] flex items-center gap-1 group transition-colors"
        >
          <span>Ver todas as fotos</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Grid of Albums */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayAlbums.map((album) => {
          const date = new Date(album.event_date);
          const formattedDate = !isNaN(date.getTime())
            ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Recente';

          return (
            <div
              key={album.id}
              onClick={() => router.push(`/empresa/${album.business_id}`)}
              className="group bg-white rounded-2xl overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)] border border-slate-100/90 hover:border-purple-300 hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
            >
              {/* Cover Image */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <Image
                  src={album.cover_image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200'}
                  alt={album.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Badge: Photo count */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold shadow-md">
                  <Camera className="w-3.5 h-3.5 text-purple-300" />
                  <span>{album.photo_count || 1} fotos</span>
                </div>

                {/* Badge: Date */}
                <div className="absolute bottom-3 left-3 bg-purple-900/90 backdrop-blur-xs text-purple-200 text-[11px] px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-semibold">
                  <Calendar className="w-3 h-3 text-purple-300" />
                  <span>{formattedDate}</span>
                </div>

                {/* Hover hint */}
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <span>Ver Empresa</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Album Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-[#7b2dc7] font-bold mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Realizado em: {album.venue_name}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#7b2dc7] transition-colors">
                    {album.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                  <div className="flex items-center gap-1 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{album.photographer_name || 'Venoapp Fotos'}</span>
                  </div>

                  <Link
                    href={`/fotos/${album.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#7b2dc7] hover:text-[#5e229c] font-bold flex items-center gap-1 transition"
                  >
                    <span>Abrir Galeria</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
