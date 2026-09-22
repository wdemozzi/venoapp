-- ==============================================================================
-- VENOAPP - SCRIPT MASTER DE CONFIGURAÇÃO DO SUPABASE (100% COMPATÍVEL)
-- Execute este script no SQL Editor do seu painel Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. ADICIONAR AS COLUNAS QUE FALTAVAM NA TABELA DE CIDADES (cities)
ALTER TABLE IF EXISTS public.cities ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT 'Tudo o que acontece na sua cidade.';
ALTER TABLE IF EXISTS public.cities ADD COLUMN IF NOT EXISTS hero_image TEXT DEFAULT '/assets/hero-new-full.jpg';
ALTER TABLE IF EXISTS public.cities ADD COLUMN IF NOT EXISTS franchisee_name TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.cities ADD COLUMN IF NOT EXISTS franchisee_email TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.cities ADD COLUMN IF NOT EXISTS franchisee_phone TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.cities ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. ADICIONAR COLUNAS AUXILIARES EM OFFERS E BUSINESSES SE FALTAR
ALTER TABLE IF EXISTS public.offers ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS subscription_price NUMERIC;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- 3. DESATIVAR RLS (Row-Level Security) NAS TABELAS PRINCIPAIS
-- Permite que o painel admin insira e altere dados sem bloqueio 42501
ALTER TABLE IF EXISTS public.plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.city_shortcuts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_albums DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_photos DISABLE ROW LEVEL SECURITY;

-- 4. CRIAR TABELA DE BANNERS DA CIDADE (city_banners) SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS public.city_banners (
  id TEXT PRIMARY KEY,
  city_id UUID,
  position TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  tagline TEXT,
  button_text TEXT,
  link_url TEXT,
  image_url TEXT,
  background_image TEXT,
  decorative_text TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.city_banners DISABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS PERMISSIVAS CASO O RLS SEJA REATIVADO NO FUTURO
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public access plans" ON public.plans;
  CREATE POLICY "Public access plans" ON public.plans FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public access cities" ON public.cities;
  CREATE POLICY "Public access cities" ON public.cities FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public access events" ON public.events;
  CREATE POLICY "Public access events" ON public.events FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public access businesses" ON public.businesses;
  CREATE POLICY "Public access businesses" ON public.businesses FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public access offers" ON public.offers;
  CREATE POLICY "Public access offers" ON public.offers FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public access city_shortcuts" ON public.city_shortcuts;
  CREATE POLICY "Public access city_shortcuts" ON public.city_shortcuts FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public access city_banners" ON public.city_banners;
  CREATE POLICY "Public access city_banners" ON public.city_banners FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public access event_albums" ON public.event_albums;
  CREATE POLICY "Public access event_albums" ON public.event_albums FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Public access event_photos" ON public.event_photos;
  CREATE POLICY "Public access event_photos" ON public.event_photos FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 6. POPULAR OU ATUALIZAR AS CIDADES BASEANDO-SE NO SLUG (sem conflito de ID existente)
INSERT INTO public.cities (slug, name, state, headline, hero_image, franchisee_name, franchisee_email, franchisee_phone, status)
VALUES
  (
    'umuarama-pr',
    'Umuarama',
    'PR',
    'Tudo o que acontece na sua cidade.',
    '/assets/hero-new-full.jpg',
    'Venoapp Matriz Umuarama',
    'contato@umuarama.venoapp.com',
    '5544997775544',
    'active'
  ),
  (
    'cianorte-pr',
    'Cianorte',
    'PR',
    'O melhor da Capital do Vestuário em um só lugar.',
    '/assets/hero-cianorte-love.jpg',
    'Franquia Cianorte',
    'contato@cianorte.venoapp.com',
    '5544998881234',
    'active'
  ),
  (
    'maringa-pr',
    'Maringá',
    'PR',
    'A Cidade Canção conectada na palma da mão.',
    '/assets/hero-maringa-love.jpg',
    'Franquia Maringá',
    'contato@maringa.venoapp.com',
    '5544991112233',
    'active'
  ),
  (
    'cascavel-pr',
    'Cascavel',
    'PR',
    'Tudo o que acontece em Cascavel.',
    '/assets/hero-cascavel-love.jpg',
    'Franquia Cascavel',
    'contato@cascavel.venoapp.com',
    '5544999990011',
    'active'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  state = EXCLUDED.state,
  headline = EXCLUDED.headline,
  hero_image = EXCLUDED.hero_image,
  franchisee_name = EXCLUDED.franchisee_name,
  franchisee_email = EXCLUDED.franchisee_email,
  franchisee_phone = EXCLUDED.franchisee_phone,
  status = EXCLUDED.status;

-- 7. POPULAR BANNERS INICIAIS NA TABELA city_banners
INSERT INTO public.city_banners (id, position, title, subtitle, tagline, button_text, link_url, image_url, is_active, order_index)
VALUES
  (
    'banner-sidebar-top',
    'sidebar_top',
    'Anuncie sua Marca Aqui',
    'Alcance milhares de pessoas em Umuarama todos os dias.',
    'PATROCÍNIO VIP',
    'Quero Anunciar',
    '/anunciar',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800',
    true,
    1
  ),
  (
    'banner-sidebar-bottom',
    'sidebar_bottom',
    'Eu Amo Umuarama',
    'Orgulho da nossa terra, das nossas empresas e da nossa gente.',
    'MOVIMENTO LOCAL',
    'Ver Guia Completo',
    '/empresas',
    '/assets/hero-new-full.jpg',
    true,
    2
  ),
  (
    'banner-hero',
    'hero',
    'Tudo o que acontece na sua cidade.',
    'Eventos, baladas, fotos exclusivas, as melhores empresas e promoções em Umuarama.',
    'PORTAL OFICIAL',
    'Explorar Agora',
    '/explorar',
    '/assets/hero-new-full.jpg',
    true,
    0
  ),
  (
    'banner-ad-1',
    'sidebar_ad',
    'Bella Estética & Spa',
    'Agende sua massagem relaxante com 20% OFF esta semana.',
    'DESTAQUE',
    'Chamar no WhatsApp',
    'https://wa.me/5544999991111',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600',
    true,
    1
  ),
  (
    'banner-ad-2',
    'sidebar_ad',
    'Sabor & Arte Gastronomia',
    'Almoço executivo e rodízio de massas artesanais.',
    'GASTRONOMIA',
    'Ver Cardápio',
    'https://wa.me/5544999992222',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600',
    true,
    2
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  button_text = EXCLUDED.button_text,
  link_url = EXCLUDED.link_url,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;

-- FIM DO SCRIPT
