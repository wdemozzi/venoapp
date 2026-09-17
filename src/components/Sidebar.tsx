import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Zap,
  Phone,
  Landmark,
  Trees,
  Info,
  ChevronRight,
  ArrowRight,
  Heart,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type { CityShortcut as SupabaseShortcut, CityBanner } from '@/lib/supabase';
import defaultBannersData from '@/data/banners.json';

const iconMap: Record<string, React.ElementType> = {
  phone: Phone,
  phonecall: Phone,
  telefones: Phone,
  landmark: Landmark,
  turisticos: Landmark,
  trees: Trees,
  treepine: Trees,
  pracas: Trees,
  info: Info,
  informacoes: Info,
  zap: Zap,
  heart: Heart,
};

function getShortcutIcon(iconName?: string): React.ElementType {
  if (!iconName) return Zap;
  const key = iconName.toLowerCase().trim();
  return iconMap[key] || Zap;
}

const defaultQuickAccessItems = [
  {
    id: 'telefones',
    title: 'Telefones úteis',
    subtitle: 'Serviços essenciais',
    icon: Phone,
    url: '#telefones',
  },
  {
    id: 'turisticos',
    title: 'Pontos turísticos',
    subtitle: 'Conheça os principais locais',
    icon: Landmark,
    url: '#turisticos',
  },
  {
    id: 'pracas',
    title: 'Praças e parques',
    subtitle: 'Lazer e natureza',
    icon: Trees,
    url: '#pracas',
  },
  {
    id: 'info',
    title: 'Informações da cidade',
    subtitle: 'Tudo sobre a cidade',
    icon: Info,
    url: '#info',
  },
];

interface SidebarProps {
  shortcuts?: SupabaseShortcut[];
  cityName?: string;
  topBanner?: CityBanner | null;
  bottomBanner?: CityBanner | null;
  adBanners?: CityBanner[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  shortcuts,
  cityName = 'Umuarama',
  topBanner,
  bottomBanner,
  adBanners,
}) => {
  const displayItems = shortcuts && shortcuts.length > 0
    ? shortcuts.map((s) => ({
        id: String(s.id),
        title: s.title,
        subtitle: s.subtitle,
        icon: getShortcutIcon(s.icon),
        url: s.link_url || s.url || `#${s.id}`,
      }))
    : defaultQuickAccessItems;

  const effectiveTopBanner = topBanner ?? (defaultBannersData.sidebar_top as CityBanner);
  const effectiveBottomBanner = bottomBanner ?? (defaultBannersData.sidebar_bottom as CityBanner);
  const effectiveAds = adBanners ?? (defaultBannersData.sidebar_ads as CityBanner[]);

  return (
    <aside className="space-y-4">
      {/* 1. App / Promo Top Banner */}
      {effectiveTopBanner.is_active !== false && (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#3c0f68] via-[#5c1899] to-[#792ec4] rounded-2xl p-5 text-white shadow-[0_4px_20px_rgba(91,25,153,0.2)] border border-purple-800/30">
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex-1 max-w-[62%]">
              <h3 className="text-base sm:text-lg font-bold leading-tight text-white">
                {effectiveTopBanner.title}
              </h3>

              {effectiveTopBanner.subtitle && (
                <p className="text-[11px] text-purple-100/85 mt-2 leading-relaxed">
                  {effectiveTopBanner.subtitle}
                </p>
              )}

              {effectiveTopBanner.button_text && (
                <a
                  href={effectiveTopBanner.link_url || '#baixar-app'}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-purple-50 text-[#54148f] font-bold text-xs px-4 py-2 rounded-full shadow-md mt-4 transition-all transform hover:translate-x-0.5 cursor-pointer"
                >
                  <span>{effectiveTopBanner.button_text}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Smartphone / Image Mockup */}
            <div className="w-[38%] flex justify-end items-center">
              <Image
                src={effectiveTopBanner.image_url || '/assets/phone-mockup-new.png'}
                alt="Banner mockup"
                width={95}
                height={190}
                className="w-full max-w-[95px] h-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
              />
            </div>
          </div>

          {/* Decorative background glow */}
          <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-[#9333ea]/30 rounded-full blur-2xl pointer-events-none" />
        </div>
      )}

      {/* 2. Quick Access Shortcuts Card */}
      <div id="explorar" className="bg-white rounded-2xl p-4 shadow-[0_2px_14px_rgba(0,0,0,0.03)] border border-slate-100/90 scroll-mt-24">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="text-[#7b2dc7]">
            <Zap className="w-4 h-4 fill-[#7b2dc7]" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Acesso rápido</h3>
        </div>

        <div className="space-y-1">
          {displayItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.url}
                className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#fbf9fe] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f3eaff] group-hover:bg-[#ebd9ff] flex items-center justify-center text-[#7b2dc7] transition-colors shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#7b2dc7] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#7b2dc7] group-hover:translate-x-0.5 transition-all" />
              </a>
            );
          })}
        </div>
      </div>

      {/* 3. Commercial / Advertiser Banners (Dynamic Ads) */}
      {effectiveAds.filter((ad) => ad.is_active !== false).map((ad) => (
        <a
          key={ad.id}
          href={ad.link_url || '#'}
          target={ad.link_url?.startsWith('http') ? '_blank' : undefined}
          rel={ad.link_url?.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="group block bg-white rounded-2xl overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-purple-300 transition-all cursor-pointer"
        >
          {ad.image_url && (
            <div className="relative h-28 w-full bg-slate-900 overflow-hidden">
              <Image
                src={ad.image_url}
                alt={ad.title}
                fill
                sizes="(max-width: 1024px) 100vw, 360px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-[10px] text-purple-200 font-bold px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Patrocinado</span>
              </div>
            </div>
          )}

          <div className="p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#7b2dc7] transition-colors line-clamp-1">
                {ad.title}
              </h4>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#7b2dc7] shrink-0 ml-1 transition-colors" />
            </div>
            {ad.subtitle && (
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{ad.subtitle}</p>
            )}
          </div>
        </a>
      ))}

      {/* 4. Bottom City Love Banner */}
      {effectiveBottomBanner.is_active !== false && (
        <Link
          href={effectiveBottomBanner.link_url || '#cidade'}
          className="group relative overflow-hidden rounded-2xl p-4 text-white shadow-sm border border-purple-900/30 block cursor-pointer"
        >
          {/* Background photo with purple overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src={effectiveBottomBanner.image_url || '/assets/love-banner-new.jpg'}
              alt={`${cityName}`}
              fill
              sizes="(max-width: 1024px) 100vw, 360px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#6b21a8]/90 via-[#581c87]/80 to-[#4338ca]/80" />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="text-purple-300">
                <Heart className="w-5 h-5 fill-purple-300" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold tracking-tight text-white">
                  {effectiveBottomBanner.title}
                </h4>
                <p className="text-[11px] text-purple-200/90 mt-0.5">
                  {effectiveBottomBanner.subtitle}
                </p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-purple-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      )}
    </aside>
  );
};
