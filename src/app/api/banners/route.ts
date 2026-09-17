import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured, BannersConfig, CityBanner } from '@/lib/supabase';
import defaultBannersData from '@/data/banners.json';

const filePath = path.join(process.cwd(), 'src', 'data', 'banners.json');

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cityParam = searchParams.get('cityId') || searchParams.get('city');

    let result: BannersConfig = defaultBannersData;

    // 1. Try reading from Supabase if table exists
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('city_banners')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        const rows = data as CityBanner[];
        const top = rows.find((r) => r.position === 'sidebar_top') || defaultBannersData.sidebar_top;
        const bottom = rows.find((r) => r.position === 'sidebar_bottom') || defaultBannersData.sidebar_bottom;
        const hero = rows.find((r) => r.position === 'hero') || defaultBannersData.hero;
        const ads = rows.filter((r) => r.position === 'sidebar_ad');

        result = {
          sidebar_top: top,
          sidebar_bottom: bottom,
          hero,
          sidebar_ads: ads.length > 0 ? ads : defaultBannersData.sidebar_ads,
        };
      } else if (fs.existsSync(filePath)) {
        try {
          result = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch {}
      }
    } else if (fs.existsSync(filePath)) {
      try {
        result = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch {}
    }

    // Se houver parâmetro de cidade, adapta o banner de amor com a imagem da cidade
    if (cityParam) {
      const citiesPath = path.join(process.cwd(), 'src', 'data', 'cities.json');
      if (fs.existsSync(citiesPath)) {
        try {
          const citiesList = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
          const matched = citiesList.find(
            (c: { id: string; slug: string; name: string; hero_image?: string }) =>
              c.id === cityParam || c.slug === cityParam
          );
          if (matched) {
            result = {
              ...result,
              sidebar_bottom: {
                ...result.sidebar_bottom,
                title: `Eu Amo ${matched.name}`,
                subtitle: `Orgulho de viver em ${matched.name}. Encontre as melhores empresas e serviços locais.`,
                image_url: matched.hero_image || result.sidebar_bottom.image_url,
              },
            };
          }
        } catch {}
      }
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.warn('[API /api/banners] Erro no GET:', err);
    return NextResponse.json(defaultBannersData);
  }
}

export async function POST(req: Request) {
  try {
    const body: BannersConfig = await req.json();

    // 1. Persist to local JSON file
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf-8');

    // 2. Try syncing with Supabase city_banners if table exists
    if (isSupabaseConfigured) {
      try {
        const rowsToUpsert: Partial<CityBanner>[] = [
          {
            id: body.sidebar_top.id || 'banner-sidebar-top',
            position: 'sidebar_top',
            title: body.sidebar_top.title,
            subtitle: body.sidebar_top.subtitle,
            button_text: body.sidebar_top.button_text,
            link_url: body.sidebar_top.link_url,
            image_url: body.sidebar_top.image_url,
            is_active: body.sidebar_top.is_active,
          },
          {
            id: body.sidebar_bottom.id || 'banner-sidebar-bottom',
            position: 'sidebar_bottom',
            title: body.sidebar_bottom.title,
            subtitle: body.sidebar_bottom.subtitle,
            link_url: body.sidebar_bottom.link_url,
            image_url: body.sidebar_bottom.image_url,
            is_active: body.sidebar_bottom.is_active,
          },
          {
            id: body.hero.id || 'banner-hero',
            position: 'hero',
            title: body.hero.title,
            subtitle: body.hero.subtitle,
            tagline: body.hero.tagline,
            image_url: body.hero.image_url,
            decorative_text: body.hero.decorative_text,
            is_active: body.hero.is_active,
          },
          ...(body.sidebar_ads || []).map((ad, idx) => ({
            id: ad.id || `ad-${idx + 1}`,
            position: 'sidebar_ad',
            title: ad.title,
            subtitle: ad.subtitle,
            button_text: ad.button_text,
            link_url: ad.link_url,
            image_url: ad.image_url,
            is_active: ad.is_active,
            order_index: idx + 1,
          })),
        ];

        await supabase.from('city_banners').upsert(rowsToUpsert);
      } catch (sbErr) {
        // If table doesn't exist yet, it's fine since local JSON was saved successfully
        console.info('[API /api/banners] Supabase city_banners not configured or error:', sbErr);
      }
    }

    return NextResponse.json({ success: true, banners: body });
  } catch (err: unknown) {
    console.error('[API /api/banners] Erro ao salvar banners:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Falha ao salvar banners' },
      { status: 500 }
    );
  }
}
