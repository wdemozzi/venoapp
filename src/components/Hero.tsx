'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { CityBanner } from '@/lib/supabase';

interface HeroProps {
  cityName?: string;
  headline?: string;
  heroImage?: string;
  heroBanner?: CityBanner | null;
}

export const Hero: React.FC<HeroProps> = ({
  cityName = 'Umuarama',
  headline,
  heroImage,
  heroBanner,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const displayImage = heroBanner?.image_url || heroImage || '/assets/hero-new-full.jpg';
  const displayHeadline = heroBanner?.title || headline || 'Tudo o que acontece na sua cidade.';
  const displayTagline = heroBanner?.tagline || 'Descubra, viva, compartilhe';
  const displaySubtitle =
    heroBanner?.subtitle ||
    'Eventos, fotos, empresas, ofertas e muito mais. Em um só lugar. Bem-vindo ao Venoapp!';
  const displayDecorative = heroBanner?.decorative_text || 'é incrível! ♡';

  return (
    <section className="relative overflow-hidden bg-[#22093c] text-white min-h-[380px] md:min-h-[400px] flex items-center">
      {/* Background Image & Blend Gradients */}
      <div className="absolute inset-0 z-0">
        <Image
          src={displayImage}
          alt={`Eu Amo ${cityName}`}
          fill
          priority
          className="object-cover object-right md:object-center"
        />

        {/* Gradient masking from solid dark purple on the left to transparent on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c0733] via-[#1f0838]/90 via-45% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#22093c]/50 via-transparent to-[#22093c]/30" />
      </div>

      <div className="relative z-10 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headlines & Search */}
          <div className="lg:col-span-8 max-w-2xl">
            <span className="text-white/70 text-xs font-bold uppercase tracking-wider block mb-2 font-sans">
              {displayTagline}
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-extrabold tracking-tight text-white leading-[1.12] mb-3.5">
              {displayHeadline}
            </h1>

            <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-lg mb-7 font-normal">
              {displaySubtitle}
            </p>

            {/* Central Floating Search Pill */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(`Buscando por: ${searchValue}`);
              }}
              className="bg-white rounded-full p-1.5 pl-5 sm:pl-6 flex items-center shadow-2xl max-w-xl border border-white/20 transition-all focus-within:ring-2 focus-within:ring-purple-400"
            >
              <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="O que você está procurando?"
                className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-xs sm:text-sm font-normal focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#792ec4] hover:bg-[#8c35df] active:scale-95 text-white font-medium text-xs sm:text-sm px-6 sm:px-8 py-2.5 sm:py-3 rounded-full transition-all shadow-md shrink-0 cursor-pointer"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Right Column: Decorative script text */}
          <div className="hidden lg:flex lg:col-span-4 justify-end items-center pr-4">
            <div className="font-handwriting text-white text-center select-none transform rotate-[-4deg] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              <span className="block text-3xl font-bold tracking-wide">
                {cityName}
              </span>
              <span className="block text-2xl font-semibold -mt-1">
                {displayDecorative}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
