'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  Calendar,
  Camera,
  Building2,
  Compass,
  Search,
  User,
  Store,
  Sparkles,
  MapPin,
  ChevronDown,
  Check,
} from 'lucide-react';
import { City, DEFAULT_CITIES } from '@/lib/supabase';

interface NavbarProps {
  currentCity?: City;
  allCities?: City[];
}

function saveCitySelection(slug: string) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('venoapp_selected_city', slug);
      window.document.cookie = `venoapp_city=${slug}; path=/; max-age=31536000; SameSite=Lax`;
    }
  } catch {
    // Ignora erro se cookies estiverem restritos
  }
}

export const Navbar: React.FC<NavbarProps> = ({ currentCity, allCities = [] }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'inicio' | 'eventos' | 'fotos' | 'empresas' | 'explorar'>('inicio');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [fetchedCities, setFetchedCities] = useState<City[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    if (allCities.length === 0) {
      fetch('/api/cities')
        .then((r) => r.json())
        .then((data) => {
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setFetchedCities(data);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [allCities.length]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayCities = allCities.length > 0 ? allCities : (fetchedCities.length > 0 ? fetchedCities : DEFAULT_CITIES);
  const activeCity = currentCity || displayCities[0] || DEFAULT_CITIES[0];

  const handleSelectCity = (c: City) => {
    setCityDropdownOpen(false);
    saveCitySelection(c.slug);
    router.push(`/${c.slug}`);
  };

  const handleNavClick = (sectionId: string, e: React.MouseEvent) => {
    setActiveTab(sectionId as any);
    if (typeof document !== 'undefined') {
      const el = document.getElementById(sectionId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', `/${activeCity.slug}#${sectionId}`);
        }
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['eventos', 'empresas', 'explorar', 'ofertas'].includes(hash)) {
        setActiveTab(hash as any);
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      }
    }
  }, []);

  return (
    <header className="bg-[#22093c] text-white sticky top-0 z-50 border-b border-[#36135c]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between gap-4">
        {/* Logo & City Selector */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Logo */}
          <Link href={`/${activeCity.slug}`} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
                <path
                  d="M6 8L18 30L30 8"
                  stroke="url(#purpleGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11 8L18 22L25 8"
                  stroke="#c084fc"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="purpleGrad" x1="6" y1="8" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a855f7" />
                    <stop offset="1" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-sans">
              veno<span className="text-[#a855f7]">app</span>
            </span>
          </Link>

          {/* City Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white font-bold px-3 py-1.5 rounded-full transition cursor-pointer shadow-sm"
              title="Trocar de cidade"
            >
              <MapPin className="w-3.5 h-3.5 text-purple-300" />
              <span>{activeCity.name} - {activeCity.state || 'PR'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-purple-300/80 transition-transform duration-150 ${
                  cityDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {cityDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-[#1b0730] border border-purple-700/60 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                  Cidades da Rede Venoapp
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {displayCities.map((c: City) => {
                    const isSelected = c.slug === activeCity.slug;
                    return (
                      <button
                        key={c.id || c.slug}
                        type="button"
                        onClick={() => handleSelectCity(c)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                          isSelected
                            ? 'bg-purple-700 text-white'
                            : 'text-purple-200 hover:bg-purple-900/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-purple-400" />
                          <span>{c.name} - {c.state || 'PR'}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href={`/${activeCity.slug}`}
              onClick={() => setActiveTab('inicio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                activeTab === 'inicio'
                  ? 'bg-[#64249d] text-white shadow-sm'
                  : 'text-white/75 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Início</span>
            </Link>

            <Link
              href={`/${activeCity.slug}#eventos`}
              onClick={(e) => handleNavClick('eventos', e)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                activeTab === 'eventos'
                  ? 'bg-[#64249d] text-white shadow-sm'
                  : 'text-white/75 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4 text-white/80" />
              <span>Eventos</span>
            </Link>

            <Link
              href="/fotos"
              onClick={() => setActiveTab('fotos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                activeTab === 'fotos'
                  ? 'bg-[#64249d] text-white shadow-sm'
                  : 'text-white/75 hover:text-white hover:bg-white/5'
              }`}
            >
              <Camera className="w-4 h-4 text-white/80" />
              <span>Fotos</span>
            </Link>

            <Link
              href={`/${activeCity.slug}#empresas`}
              onClick={(e) => handleNavClick('empresas', e)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                activeTab === 'empresas'
                  ? 'bg-[#64249d] text-white shadow-sm'
                  : 'text-white/75 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-4 h-4 text-white/80" />
              <span>Empresas</span>
            </Link>

            <Link
              href={`/${activeCity.slug}#explorar`}
              onClick={(e) => handleNavClick('explorar', e)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                activeTab === 'explorar'
                  ? 'bg-[#64249d] text-white shadow-sm'
                  : 'text-white/75 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4 text-white/80" />
              <span>Explorar</span>
            </Link>
          </nav>
        </div>

        {/* Right Area: Search, Anunciar, Partner Portal & Admin */}
        <div className="flex items-center gap-3">
          <div className="relative hidden xl:flex items-center">
            <input
              type="text"
              placeholder={`Buscar em ${activeCity.name}...`}
              className="w-44 bg-[#381559]/80 text-white placeholder-white/50 text-xs pl-9 pr-4 py-2 rounded-full border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-[#431b6b] transition-all"
            />
            <Search className="w-4 h-4 text-white/50 absolute left-3 pointer-events-none" />
          </div>

          <Link
            href={`/anunciar?cidade=${activeCity.slug}`}
            title="Anunciar Empresa no Venoapp"
            className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl shadow-md shadow-purple-950 transition transform hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Anunciar Empresa</span>
            <span className="sm:hidden">Anunciar</span>
          </Link>

          <Link
            href="/portal-parceiro"
            title="Portal do Parceiro (Área do Anunciante)"
            className="hidden lg:flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 text-purple-200 hover:text-white px-3 py-2 rounded-xl transition"
          >
            <Store className="w-3.5 h-3.5 text-purple-300" />
            <span>Área do Parceiro</span>
          </Link>

          <Link
            href="/admin"
            title="Painel Administrativo"
            aria-label="Painel Administrativo"
            className="w-9 h-9 rounded-full bg-[#7526bb] hover:bg-[#8532d1] flex items-center justify-center text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1b062f]/95 backdrop-blur-md border-t border-purple-800/40 px-2 py-2 flex items-center justify-around shadow-2xl text-[10px]">
        <Link
          href={`/${activeCity.slug}`}
          onClick={() => setActiveTab('inicio')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'inicio' ? 'text-purple-300 font-bold' : 'text-purple-200/70 hover:text-white'}`}
        >
          <Home className="w-5 h-5" />
          <span>Início</span>
        </Link>
        <Link
          href={`/${activeCity.slug}#eventos`}
          onClick={(e) => handleNavClick('eventos', e)}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'eventos' ? 'text-purple-300 font-bold' : 'text-purple-200/70 hover:text-white'}`}
        >
          <Calendar className="w-5 h-5" />
          <span>Eventos</span>
        </Link>
        <Link
          href="/fotos"
          onClick={() => setActiveTab('fotos')}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'fotos' ? 'text-purple-300 font-bold' : 'text-purple-200/70 hover:text-white'}`}
        >
          <Camera className="w-5 h-5" />
          <span>Fotos</span>
        </Link>
        <Link
          href={`/${activeCity.slug}#empresas`}
          onClick={(e) => handleNavClick('empresas', e)}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'empresas' ? 'text-purple-300 font-bold' : 'text-purple-200/70 hover:text-white'}`}
        >
          <Building2 className="w-5 h-5" />
          <span>Empresas</span>
        </Link>
        <Link
          href={`/${activeCity.slug}#explorar`}
          onClick={(e) => handleNavClick('explorar', e)}
          className={`flex flex-col items-center gap-1 transition ${activeTab === 'explorar' ? 'text-purple-300 font-bold' : 'text-purple-200/70 hover:text-white'}`}
        >
          <Compass className="w-5 h-5" />
          <span>Explorar</span>
        </Link>
      </nav>
    </header>
  );
};
