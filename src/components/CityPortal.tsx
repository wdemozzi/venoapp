import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { CategoryPills } from "@/components/CategoryPills";
import { FeaturedEvents } from "@/components/FeaturedEvents";
import { FeaturedOffers } from "@/components/FeaturedOffers";
import { FeaturedAlbums } from "@/components/FeaturedAlbums";
import { FeaturedCompanies } from "@/components/FeaturedCompanies";
import { Sidebar } from "@/components/Sidebar";
import {
  City,
  getEventsByCity,
  getBusinessesByCity,
  getCityShortcuts,
  getAlbumsByCity,
  getBannersConfig,
  getOffersByCity,
} from "@/lib/supabase";

interface CityPortalProps {
  city: City;
  allCities: City[];
}

export async function CityPortal({ city, allCities }: CityPortalProps) {
  const cityId = city.id;

  // Fetch events, albums, businesses, shortcuts, banners, and offers for this specific city
  const [events, albums, businesses, shortcuts, bannersConfig, offers] = await Promise.all([
    cityId ? getEventsByCity(cityId) : Promise.resolve([]),
    cityId ? getAlbumsByCity(cityId) : Promise.resolve([]),
    cityId ? getBusinessesByCity(cityId) : Promise.resolve([]),
    cityId ? getCityShortcuts(cityId) : Promise.resolve([]),
    getBannersConfig(cityId),
    cityId ? getOffersByCity(cityId) : Promise.resolve([]),
  ]);

  const cityName = city.name || "Umuarama";
  const cityState = city.state || "PR";

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Navigation with City Selector */}
      <Navbar currentCity={city} allCities={allCities} />

      {/* Hero Banner with dynamic city and banner info */}
      <Hero
        cityName={cityName}
        headline={city.headline}
        heroImage={city.hero_image}
        heroBanner={bannersConfig.hero}
      />

      {/* Main Container */}
      <main className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* Category Navigation Pills */}
        <section aria-label="Categorias">
          <CategoryPills />
        </section>

        {/* 2-Column Main Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Left Feed */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-8">
            <FeaturedEvents events={events} />
            <FeaturedOffers offers={offers} businesses={businesses} />
            <FeaturedAlbums albums={albums} />
            <FeaturedCompanies businesses={businesses} />
          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-4 xl:col-span-3">
            <Sidebar
              shortcuts={shortcuts}
              cityName={cityName}
              topBanner={bannersConfig.sidebar_top}
              bottomBanner={bannersConfig.sidebar_bottom}
              adBanners={bannersConfig.sidebar_ads}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-[1360px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">venoapp</span>
            <span>•</span>
            <span>{cityName} - {cityState}</span>
            <span>•</span>
            <Link
              href={`/anunciar?cidade=${city.slug}`}
              className="text-[#7b2dc7] hover:text-[#5e229c] hover:underline font-bold transition"
            >
              Anunciar Empresa (Planos)
            </Link>
            <span>•</span>
            <Link
              href="/portal-parceiro"
              className="text-slate-600 hover:text-slate-900 hover:underline font-medium transition"
            >
              Área do Comerciante
            </Link>
            <span>•</span>
            <Link
              href="/admin"
              className="text-slate-500 hover:text-slate-700 hover:underline font-medium transition"
            >
              Painel Admin
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Venoapp {cityName}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
