import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase, isSupabaseConfigured, BannersConfig, CityBanner, clearCache } from '@/lib/supabase';
import defaultBannersData from '@/data/banners.json';
import defaultCitiesData from '@/data/cities.json';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cityParam = searchParams.get('cityId') || searchParams.get('city');

    let result: BannersConfig = defaultBannersData as unknown as BannersConfig;

    // 1. Try reading from Supabase if table exists
    if (isSupabaseConfigured) {
      let query = supabase
        .from('city_banners')
        .select('*')
        .order('order_index', { ascending: true });

      if (cityParam) {
        query = query.or(`city_id.eq.${cityParam},city_id.is.null`);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const rows = data as CityBanner[];
        const top = rows.find((r) => r.position === 'sidebar_top') || (defaultBannersData as unknown as BannersConfig).sidebar_top;
        const bottom = rows.find((r) => r.position === 'sidebar_bottom') || (defaultBannersData as unknown as BannersConfig).sidebar_bottom;
        const hero = rows.find((r) => r.position === 'hero') || (defaultBannersData as unknown as BannersConfig).hero;
        const ads = rows.filter((r) => r.position === 'sidebar_ad');

        result = {
          sidebar_top: top,
          sidebar_bottom: bottom,
          hero,
          sidebar_ads: ads.length > 0 ? ads : (defaultBannersData as unknown as BannersConfig).sidebar_ads,
        };
      }
    }

    // Se houver parâmetro de cidade, adapta o banner de amor com a imagem da cidade se necessário
    if (cityParam && result.sidebar_bottom.title.includes('Umuarama')) {
      const citiesList = defaultCitiesData;
      const matched = citiesList.find(
        (c) => c.id === cityParam || c.slug === cityParam
      );
      if (matched && matched.name !== 'Umuarama') {
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
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.warn('[API /api/banners] Erro no GET:', err);
    return NextResponse.json(defaultBannersData);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const banners: BannersConfig = body.banners || body;
    const cityId = body.cityId || null;

    if (isSupabaseConfigured) {
      const rowsToUpsert: Partial<CityBanner>[] = [
        {
          id: banners.sidebar_top.id || (cityId ? `banner-sidebar-top-${cityId}` : 'banner-sidebar-top'),
          city_id: cityId,
          position: 'sidebar_top',
          title: banners.sidebar_top.title,
          subtitle: banners.sidebar_top.subtitle,
          button_text: banners.sidebar_top.button_text,
          link_url: banners.sidebar_top.link_url,
          image_url: banners.sidebar_top.image_url,
          is_active: banners.sidebar_top.is_active,
        },
        {
          id: banners.sidebar_bottom.id || (cityId ? `banner-sidebar-bottom-${cityId}` : 'banner-sidebar-bottom'),
          city_id: cityId,
          position: 'sidebar_bottom',
          title: banners.sidebar_bottom.title,
          subtitle: banners.sidebar_bottom.subtitle,
          link_url: banners.sidebar_bottom.link_url,
          image_url: banners.sidebar_bottom.image_url,
          is_active: banners.sidebar_bottom.is_active,
        },
        {
          id: banners.hero.id || (cityId ? `banner-hero-${cityId}` : 'banner-hero'),
          city_id: cityId,
          position: 'hero',
          title: banners.hero.title,
          subtitle: banners.hero.subtitle,
          tagline: banners.hero.tagline,
          image_url: banners.hero.image_url,
          decorative_text: banners.hero.decorative_text,
          is_active: banners.hero.is_active,
        },
        ...(banners.sidebar_ads || []).map((ad, idx) => ({
          id: ad.id || (cityId ? `ad-${cityId}-${idx + 1}` : `ad-${idx + 1}`),
          city_id: cityId,
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

      const { error } = await supabase.from('city_banners').upsert(rowsToUpsert).select();
      if (error) {
        console.error('[API /api/banners] Erro ao salvar city_banners no Supabase:', error);
        return NextResponse.json(
          { error: `Erro no Supabase: ${error.message}. Certifique-se de executar o script SQL no Supabase para criar a tabela city_banners.` },
          { status: 500 }
        );
      }
    }

    clearCache('banners:');
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/[citySlug]', 'layout');
    } catch {}

    return NextResponse.json({ success: true, banners });
  } catch (err: unknown) {
    console.error('[API /api/banners] Erro ao salvar banners:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Falha ao salvar banners' },
      { status: 500 }
    );
  }
}
