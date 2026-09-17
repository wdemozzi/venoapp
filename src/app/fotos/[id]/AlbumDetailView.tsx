'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Camera,
  Calendar,
  User,
  Share2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Check,
  Sparkles,
  Maximize2,
  Building2
} from 'lucide-react';
import { EventAlbum, EventPhoto } from '@/lib/supabase';

interface AlbumDetailViewProps {
  album: EventAlbum;
  photos: EventPhoto[];
}

export function AlbumDetailView({ album, photos }: AlbumDetailViewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photoCopied, setPhotoCopied] = useState(false);

  // Format date
  const date = new Date(album.event_date);
  const formattedDate = !isNaN(date.getTime())
    ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Data recente';

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return;
    setIsZoomed(false);
    setSelectedIndex((prev) => (prev! > 0 ? prev! - 1 : photos.length - 1));
  }, [selectedIndex, photos.length]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    setIsZoomed(false);
    setSelectedIndex((prev) => (prev! < photos.length - 1 ? prev! + 1 : 0));
  }, [selectedIndex, photos.length]);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
    setIsZoomed(false);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'z' || e.key === 'Z') {
        setIsZoomed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, handleClose, handlePrev, handleNext]);

  // Share album link
  const handleShareAlbum = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: album.title + ' - Venoapp Coberturas',
          text: `Confira a cobertura de fotos de "${album.title}" no Venoapp!`,
          url,
        });
        return;
      } catch {
        // User cancelled or unsupported, fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Share specific photo link
  const handleSharePhoto = async (photoUrl: string) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(photoUrl);
      setPhotoCopied(true);
      setTimeout(() => setPhotoCopied(false), 3000);
    }
  };

  // Download photo
  const handleDownloadPhoto = async (photoUrl: string, index: number) => {
    try {
      const res = await fetch(photoUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${album.title.replace(/\s+/g, '_')}_foto_${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open directly in new tab
      window.open(photoUrl, '_blank');
    }
  };

  const currentPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header / Hero Section */}
      <section className="bg-gradient-to-b from-[#22093c] via-[#2a0b49] to-[#1c0733] text-white py-10 px-4 sm:px-6 border-b border-[#3b1563]">
        <div className="max-w-[1360px] mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-purple-300/80 mb-6 flex-wrap">
            <Link href="/" className="hover:text-white transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Início</span>
            </Link>
            <span>/</span>
            <Link href="/fotos" className="hover:text-white transition">
              Cobertura de Fotos
            </Link>
            <span>/</span>
            <span className="text-white font-medium truncate max-w-xs">{album.title}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-purple-900/70 border border-purple-700/60 text-purple-200 text-xs px-3 py-1 rounded-full font-bold">
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                <span>Cobertura Completa</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {album.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm text-purple-200/80 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>{formattedDate}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>Fotógrafo: <strong className="text-white">{album.photographer_name || 'Venoapp Fotos'}</strong></span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>{photos.length} {photos.length === 1 ? 'foto registrada' : 'fotos registradas'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 lg:pt-0">
              <Link
                href={`/empresa/${(album as { business_id?: string }).business_id || (album.title.toLowerCase().includes('expo') ? 'parque-exposicoes' : 'parque-exposicoes')}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs sm:text-sm font-bold shadow-md transition active:scale-95 cursor-pointer"
                title="Ver perfil da empresa / local do evento"
              >
                <Building2 className="w-4 h-4 text-purple-300" />
                <span>Ver Local / Empresa</span>
              </Link>

              <button
                onClick={handleShareAlbum}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-900/40 transition active:scale-95 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'Link Copiado!' : 'Compartilhar'}</span>
              </button>

              <Link
                href="/fotos"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-purple-200 hover:text-white text-xs sm:text-sm font-medium transition cursor-pointer"
              >
                <span>Mais Álbuns</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Grid Section */}
      <main className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-10 flex-1">
        {photos.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-md mx-auto my-12 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#7b2dc7] flex items-center justify-center mx-auto">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Fotos em processamento</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              As fotos deste evento estão sendo selecionadas e tratadas pela nossa equipe. Elas estarão disponíveis aqui muito em breve!
            </p>
            <Link
              href="/fotos"
              className="inline-flex items-center gap-2 bg-[#7b2dc7] hover:bg-[#6824ab] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ver outras coberturas</span>
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                Clique em qualquer foto para ampliar e navegar em alta resolução
              </p>
              <span className="text-xs text-[#7b2dc7] font-bold bg-purple-50 border border-purple-200/60 px-3 py-1 rounded-full">
                {photos.length} fotos
              </span>
            </div>

            {/* Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id || idx}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setIsZoomed(false);
                  }}
                  className="group relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200/60 hover:border-purple-500"
                >
                  <Image
                    src={photo.photo_url}
                    alt={photo.caption || `${album.title} - foto ${idx + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover group-hover:scale-108 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-200 w-10 h-10 rounded-full bg-white/90 text-[#7b2dc7] flex items-center justify-center shadow-lg">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                  </div>

                  {photo.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[11px] text-white font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.caption}
                    </div>
                  )}

                  {/* Badge index */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md opacity-70 group-hover:opacity-100 transition">
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* FULLSCREEN LIGHTBOX MODAL */}
      {/* ======================================================== */}
      {selectedIndex !== null && currentPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
        >
          {/* Top Bar Controls */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-10">
            <div className="flex items-center gap-3">
              <span className="text-white font-mono text-xs sm:text-sm bg-white/10 px-3 py-1.5 rounded-xl font-bold border border-white/10">
                {selectedIndex + 1} / {photos.length}
              </span>
              <span className="text-purple-300 text-xs sm:text-sm font-semibold truncate max-w-xs sm:max-w-md hidden sm:inline">
                {album.title}
              </span>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2">
              {/* Zoom toggle */}
              <button
                onClick={() => setIsZoomed((prev) => !prev)}
                title={isZoomed ? 'Diminuir Zoom' : 'Aumentar Zoom'}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer border border-white/10"
              >
                {isZoomed ? <ZoomOut className="w-4 h-4 text-purple-300" /> : <ZoomIn className="w-4 h-4 text-purple-300" />}
              </button>

              {/* Share single photo */}
              <button
                onClick={() => handleSharePhoto(currentPhoto.photo_url)}
                title="Copiar link da foto"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer border border-white/10 relative"
              >
                {photoCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                {photoCopied && (
                  <span className="absolute -bottom-8 right-0 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                    Link copiado!
                  </span>
                )}
              </button>

              {/* Download Photo */}
              <button
                onClick={() => handleDownloadPhoto(currentPhoto.photo_url, selectedIndex)}
                title="Baixar esta foto"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer border border-white/10"
              >
                <Download className="w-4 h-4 text-emerald-400" />
              </button>

              {/* Close Modal */}
              <button
                onClick={handleClose}
                title="Fechar (Esc)"
                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition active:scale-95 cursor-pointer ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Image Viewport */}
          <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
            {/* Previous Button */}
            <button
              onClick={handlePrev}
              title="Foto anterior (Seta esquerda)"
              className="absolute left-2 sm:left-6 z-20 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition active:scale-90 cursor-pointer shadow-2xl"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>

            {/* Current Image Container */}
            <div
              className={`relative transition-all duration-300 max-h-[80vh] flex items-center justify-center ${
                isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed((prev) => !prev)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentPhoto.photo_url}
                alt={currentPhoto.caption || `${album.title} foto ${selectedIndex + 1}`}
                className="max-h-[78vh] max-w-[92vw] object-contain rounded-xl shadow-2xl transition-transform duration-200 select-none pointer-events-auto"
              />
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              title="Próxima foto (Seta direita)"
              className="absolute right-2 sm:right-6 z-20 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition active:scale-90 cursor-pointer shadow-2xl"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          </div>

          {/* Bottom Bar: Caption & Thumbnails Strip */}
          <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent px-4 sm:px-6 pb-5 pt-3 space-y-3 z-10">
            {currentPhoto.caption && (
              <p className="text-center text-xs sm:text-sm text-purple-200 font-medium max-w-xl mx-auto truncate">
                {currentPhoto.caption}
              </p>
            )}

            {/* Thumbnails Navigation Strip */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-4xl mx-auto scrollbar-thin scrollbar-thumb-purple-600">
              {photos.map((p, idx) => (
                <button
                  key={p.id || idx}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setIsZoomed(false);
                  }}
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 transition-all cursor-pointer border-2 ${
                    selectedIndex === idx
                      ? 'border-purple-400 scale-110 shadow-lg shadow-purple-900/50'
                      : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <Image
                    src={p.photo_url}
                    alt="thumbnail"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
