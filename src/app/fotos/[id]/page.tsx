import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { AlbumDetailView } from './AlbumDetailView';
import { getAlbumById, getPhotosByAlbum, getCityBySlug } from '@/lib/supabase';
import { Camera, ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 30;

export default async function AlbumDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [album, photos, city] = await Promise.all([
    getAlbumById(id),
    getPhotosByAlbum(id),
    getCityBySlug('umuarama-pr'),
  ]);

  const cityName = city?.name || 'Umuarama';

  if (!album) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#7b2dc7] flex items-center justify-center mx-auto">
              <Camera className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Cobertura não encontrada</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              O álbum solicitado pode ter sido removido ou o endereço informado está incorreto.
            </p>
            <Link
              href="/fotos"
              className="inline-flex items-center gap-2 bg-[#7b2dc7] hover:bg-[#6824ab] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ver todas as coberturas</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If album has no photos registered in event_photos yet, but has cover_image_url, provide cover as first photo
  const effectivePhotos =
    photos.length > 0
      ? photos
      : album.cover_image_url
      ? [
          {
            id: 'cover-' + album.id,
            album_id: album.id,
            photo_url: album.cover_image_url,
            caption: 'Foto de capa da cobertura',
          },
        ]
      : [];

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Album Detail Component with Lightbox */}
      <AlbumDetailView album={album} photos={effectivePhotos} />

      {/* Footer */}
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
