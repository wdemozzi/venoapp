import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Camera, Calendar, User, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { getCityBySlug, getAlbumsByCity } from '@/lib/supabase';

export const revalidate = 60;

export default async function FotosPage() {
  const city = await getCityBySlug('umuarama-pr');
  const cityId = city?.id || '48d98d79-bafe-460f-9a5f-dd5dc04e85ed';
  const cityName = city?.name || 'Umuarama';

  const albums = await getAlbumsByCity(cityId);

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      {/* Page Hero / Header */}
      <section className="bg-gradient-to-b from-[#22093c] via-[#2a0b49] to-[#1c0733] text-white py-12 px-4 sm:px-6 border-b border-[#3b1563]">
        <div className="max-w-[1360px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-purple-300/80 mb-4">
            <Link href="/" className="hover:text-white transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Início</span>
            </Link>
            <span>/</span>
            <span className="text-white font-medium">Cobertura de Fotos</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-900/60 border border-purple-700/50 text-purple-200 text-xs px-3 py-1 rounded-full font-bold mb-3">
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                <span>Galeria Oficial de Eventos</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                Coberturas Fotográficas
              </h1>
              <p className="text-purple-200/80 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed">
                Reviva as melhores experiências, shows, festivais e eventos sociais de {cityName}. Encontre suas fotos e compartilhe com os amigos!
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-purple-300/90 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl shrink-0">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{albums.length} {albums.length === 1 ? 'cobertura disponível' : 'coberturas disponíveis'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-10 flex-1">
        {albums.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-md mx-auto my-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#7b2dc7] flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Nenhuma cobertura no momento</h3>
            <p className="text-xs text-slate-500">
              Novos álbuns fotográficos serão publicados em breve. Fique ligado na nossa agenda de eventos!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#7b2dc7] hover:underline pt-2"
            >
              ← Voltar ao início
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {albums.map((album) => {
              const date = new Date(album.event_date);
              const formattedDate = !isNaN(date.getTime())
                ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                : 'Data recente';

              return (
                <Link
                  key={album.id}
                  href={`/fotos/${album.id}`}
                  className="group bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* Cover Image Container */}
                  <div className="relative h-56 w-full overflow-hidden bg-slate-900">
                    <Image
                      src={
                        album.cover_image_url ||
                        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200'
                      }
                      alt={album.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                    {/* Photo count badge */}
                    <div className="absolute top-3.5 right-3.5 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-bold shadow-md border border-white/10">
                      <Camera className="w-3.5 h-3.5 text-purple-300" />
                      <span>{album.photo_count || 1} fotos</span>
                    </div>

                    {/* Date badge */}
                    <div className="absolute bottom-3.5 left-3.5 bg-purple-900/90 backdrop-blur-md text-purple-200 text-xs px-3 py-1 rounded-xl flex items-center gap-1.5 font-semibold border border-purple-700/40">
                      <Calendar className="w-3.5 h-3.5 text-purple-300" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  {/* Album Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h2 className="font-bold text-slate-900 text-base leading-snug group-hover:text-[#7b2dc7] transition-colors line-clamp-2">
                        {album.title}
                      </h2>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{album.photographer_name || 'Venoapp Fotos'}</span>
                      </div>

                      <span className="text-[#7b2dc7] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
                        Ver fotos <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-[1360px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">venoapp</span>
            <span>•</span>
            <span>{cityName} - PR</span>
            <span>•</span>
            <Link
              href="/admin"
              className="text-[#7b2dc7] hover:text-[#5e229c] hover:underline font-semibold transition"
            >
              Painel Admin
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Venoapp. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
