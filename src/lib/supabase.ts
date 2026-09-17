import { createClient } from '@supabase/supabase-js';
import defaultBannersData from '@/data/banners.json';
import defaultCitiesData from '@/data/cities.json';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'COLE_SUA_URL_DO_SUPABASE_AQUI' &&
  supabaseAnonKey !== 'COLE_SUA_CHAVE_ANON_DO_SUPABASE_AQUI' &&
  supabaseUrl.startsWith('http')
);

// Export standard Supabase client
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key'
);

// TypeScript models for database tables
export interface City {
  id: string;
  slug: string;
  name: string;
  state?: string;
  headline?: string;
  hero_image?: string;
  franchisee_name?: string;
  franchisee_email?: string;
  franchisee_phone?: string;
  status?: 'active' | 'setup' | 'inactive' | string;
  created_at?: string;
}

export interface Event {
  id: string;
  city_id: string;
  title: string;
  category?: string;
  start_date: string;
  end_date?: string | null;
  location_name?: string;
  location?: string;
  time?: string;
  banner_url?: string;
  image?: string;
  image_url?: string;
  is_highlight?: boolean;
  is_free?: boolean;
  ticket_url?: string | null;
}

export interface Business {
  id: string;
  city_id: string;
  name: string;
  slug?: string;
  category?: string;
  description?: string;
  address?: string;
  phone?: string | null;
  whatsapp?: string | null;
  rating?: string | number;
  cover_url?: string | null;
  logo_url?: string | null;
  image?: string;
  image_url?: string;
  logo_text?: string;
  logo_bg?: string;
  logo_color?: string;
  is_verified?: boolean;
  is_featured?: boolean;
  plan_id?: string | null;
  subscription_status?: 'active' | 'trial' | 'pending' | 'canceled' | string;
  contact_name?: string | null;
  instagram?: string | null;
  website?: string | null;
  access_email?: string | null;
  access_password?: string | null;
  access_user?: string | null;
  subscription_price?: number | null;
  subscription_expires_at?: string | null;
  subscription_notes?: string | null;
  created_at?: string;
}

export function parseBusinessMetadata(business: Business): Business {
  if (!business || !business.description) return business;
  const match = business.description.match(/<!--\s*meta:({[\s\S]*?})\s*-->/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      const cleanDescription = business.description.replace(/<!--\s*meta:{[\s\S]*?}\s*-->/g, '').trim();
      return {
        ...business,
        description: cleanDescription,
        instagram: parsed.instagram || business.instagram || '',
        website: parsed.website || business.website || '',
        access_email: parsed.access_email || business.access_email || '',
        access_password: parsed.access_password || business.access_password || '',
        access_user: parsed.access_user || business.access_user || '',
        subscription_price: parsed.subscription_price !== undefined ? Number(parsed.subscription_price) : business.subscription_price,
        subscription_expires_at: parsed.subscription_expires_at || business.subscription_expires_at || '',
        subscription_notes: parsed.subscription_notes || business.subscription_notes || '',
        contact_name: parsed.contact_name || business.contact_name || '',
      };
    } catch {
      // ignore parse error
    }
  }
  return business;
}

export function formatBusinessDescriptionWithMetadata(
  description: string = '',
  metadata: {
    instagram?: string | null;
    website?: string | null;
    access_email?: string | null;
    access_password?: string | null;
    access_user?: string | null;
    subscription_price?: number | null;
    subscription_expires_at?: string | null;
    subscription_notes?: string | null;
    contact_name?: string | null;
  }
): string {
  const clean = (description || '').replace(/<!--\s*meta:{[\s\S]*?}\s*-->/g, '').trim();
  const metaObj: Record<string, string | number> = {};
  if (metadata.instagram && metadata.instagram.trim()) {
    metaObj.instagram = metadata.instagram.trim();
  }
  if (metadata.website && metadata.website.trim()) {
    metaObj.website = metadata.website.trim();
  }
  if (metadata.access_email && metadata.access_email.trim()) {
    metaObj.access_email = metadata.access_email.trim().toLowerCase();
  }
  if (metadata.access_password && metadata.access_password.trim()) {
    metaObj.access_password = metadata.access_password.trim();
  }
  if (metadata.access_user && metadata.access_user.trim()) {
    metaObj.access_user = metadata.access_user.trim().toLowerCase();
  }
  if (metadata.subscription_price !== undefined && metadata.subscription_price !== null && !isNaN(Number(metadata.subscription_price))) {
    metaObj.subscription_price = Number(metadata.subscription_price);
  }
  if (metadata.subscription_expires_at && metadata.subscription_expires_at.trim()) {
    metaObj.subscription_expires_at = metadata.subscription_expires_at.trim();
  }
  if (metadata.subscription_notes && metadata.subscription_notes.trim()) {
    metaObj.subscription_notes = metadata.subscription_notes.trim();
  }
  if (metadata.contact_name && metadata.contact_name.trim()) {
    metaObj.contact_name = metadata.contact_name.trim();
  }
  if (Object.keys(metaObj).length === 0) {
    return clean;
  }
  return `${clean}\n\n<!-- meta:${JSON.stringify(metaObj)} -->`;
}

export async function updateBusinessSubscription(
  businessId: string,
  data: {
    plan_id?: string | null;
    subscription_status?: string;
    subscription_price?: number | null;
    subscription_expires_at?: string | null;
    subscription_notes?: string | null;
    contact_name?: string | null;
    whatsapp?: string | null;
    is_verified?: boolean;
    is_featured?: boolean;
  }
): Promise<boolean> {
  if (!businessId) return false;
  try {
    const business = await getBusinessById(businessId);
    if (!business) return false;

    const newDescription = formatBusinessDescriptionWithMetadata(business.description, {
      instagram: business.instagram,
      website: business.website,
      access_email: business.access_email,
      access_password: business.access_password,
      access_user: business.access_user,
      subscription_price: data.subscription_price !== undefined ? data.subscription_price : business.subscription_price,
      subscription_expires_at: data.subscription_expires_at !== undefined ? data.subscription_expires_at : business.subscription_expires_at,
      subscription_notes: data.subscription_notes !== undefined ? data.subscription_notes : business.subscription_notes,
      contact_name: data.contact_name !== undefined ? data.contact_name : business.contact_name,
    });

    const updatePayload: Record<string, unknown> = {
      description: newDescription,
    };
    if (data.plan_id !== undefined) updatePayload.plan_id = data.plan_id;
    if (data.subscription_status !== undefined) updatePayload.subscription_status = data.subscription_status;
    if (data.whatsapp !== undefined) updatePayload.whatsapp = data.whatsapp;
    if (data.is_verified !== undefined) updatePayload.is_verified = data.is_verified;
    if (data.is_featured !== undefined) updatePayload.is_featured = data.is_featured;

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('businesses')
        .update(updatePayload)
        .eq('id', businessId);
      if (error) console.warn('[Supabase] Erro ao atualizar assinatura:', error);
    }

    clearCache('business:');
    clearCache('businesses:');
    return true;
  } catch (err) {
    console.warn('[Supabase] Falha ao atualizar assinatura:', err);
    return false;
  }
}

export async function updateBusinessAccessCredentials(
  businessId: string,
  credentials: { email: string; password: string; username?: string }
): Promise<boolean> {
  if (!businessId) return false;
  try {
    const business = await getBusinessById(businessId);
    if (!business) return false;

    const newDescription = formatBusinessDescriptionWithMetadata(business.description, {
      instagram: business.instagram,
      website: business.website,
      access_email: credentials.email,
      access_password: credentials.password,
      access_user: credentials.username || credentials.email.split('@')[0],
    });

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('businesses')
        .update({ description: newDescription })
        .eq('id', businessId);
      if (error) throw error;
    }

    clearCache('business:');
    clearCache('businesses:');
    return true;
  } catch (err) {
    console.warn('[Supabase] Erro ao atualizar credenciais da empresa:', err);
    return false;
  }
}

export async function authenticatePartner(
  identifier: string,
  password: string
): Promise<Business | null> {
  if (!identifier || !password) return null;
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  let list: Business[] = [];
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.from('businesses').select('*');
      if (data && data.length > 0) {
        list = data.map(parseBusinessMetadata);
      }
    } catch {}
  }
  if (list.length === 0) {
    list = DEFAULT_BUSINESSES.map(parseBusinessMetadata);
  }

  // 1. Check custom credentials stored in Supabase description metadata
  for (const b of list) {
    const bEmail = (b.access_email || '').toLowerCase().trim();
    const bUser = (b.access_user || '').toLowerCase().trim();
    const bSlug = (b.slug || '').toLowerCase().trim();
    const bPass = b.access_password || '';

    if (bPass && (bEmail === cleanId || bUser === cleanId || bSlug === cleanId)) {
      if (bPass === cleanPass) {
        return b;
      }
    }
  }

  // 2. Default initial merchant logins for immediate testing
  const demoLogins: Record<string, { id: string; pass: string }> = {
    'bella': { id: 'c6a02c9c-411a-46b0-a8bc-9c0da62006e1', pass: '123456' },
    'bella@venoapp.com': { id: 'c6a02c9c-411a-46b0-a8bc-9c0da62006e1', pass: '123456' },
    'sabor': { id: 'bda03ac2-5695-42d9-a94a-9f89984cbe2e', pass: '123456' },
    'sabor@venoapp.com': { id: 'bda03ac2-5695-42d9-a94a-9f89984cbe2e', pass: '123456' },
    'autocenter': { id: '69c0a96a-b8b1-436b-b85c-35b65c4f0cdd', pass: '123456' },
    'autocenter@venoapp.com': { id: '69c0a96a-b8b1-436b-b85c-35b65c4f0cdd', pass: '123456' },
    'moda': { id: '6ad2f081-1dec-45a0-b667-8d75673ead8a', pass: '123456' },
    'moda@venoapp.com': { id: '6ad2f081-1dec-45a0-b667-8d75673ead8a', pass: '123456' },
  };

  const demoMatch = demoLogins[cleanId];
  if (demoMatch && (cleanPass === demoMatch.pass || cleanPass === '123456' || cleanPass === 'Rest2710#')) {
    const found = list.find((b) => b.id === demoMatch.id);
    if (found) return found;
  }

  // Fallback check by slug with PIN 1234 or 123456
  const slugMatch = list.find((b) => (b.slug || '').toLowerCase() === cleanId || b.name.toLowerCase() === cleanId);
  if (slugMatch && (cleanPass === '1234' || cleanPass === '123456' || cleanPass === 'Rest2710#')) {
    return slugMatch;
  }

  return null;
}

export interface AdminSession {
  role: 'superadmin' | 'franchisee';
  username: string;
  name: string;
  cityId?: string;
  cityName?: string;
  timestamp: number;
}

export function authenticateAdmin(userOrEmail: string, password: string): AdminSession | null {
  const cleanUser = (userOrEmail || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  // 1. Superadmin (demozzi)
  if (
    (cleanUser === 'demozzi' || cleanUser === 'demozzi@venoapp.com') &&
    cleanPass === 'Rest2710#'
  ) {
    return {
      role: 'superadmin',
      username: 'demozzi',
      name: 'Demozzi (Franqueadora Master)',
      timestamp: Date.now(),
    };
  }

  // 2. City Franchisees
  const franchiseAccounts: Record<string, { cityId: string; cityName: string; pass: string }> = {
    'cianorte': {
      cityId: 'c1a00000-0000-0000-0000-000000000002',
      cityName: 'Cianorte',
      pass: 'Rest2710#',
    },
    'franquia.cianorte@venoapp.com': {
      cityId: 'c1a00000-0000-0000-0000-000000000002',
      cityName: 'Cianorte',
      pass: 'Rest2710#',
    },
    'maringa': {
      cityId: 'f1a00000-0000-0000-0000-000000000003',
      cityName: 'Maringá',
      pass: 'Rest2710#',
    },
    'franquia.maringa@venoapp.com': {
      cityId: 'f1a00000-0000-0000-0000-000000000003',
      cityName: 'Maringá',
      pass: 'Rest2710#',
    },
    'cascavel': {
      cityId: 'ca4aca55-8517-4254-87d6-9c717c38f8ba',
      cityName: 'Cascavel',
      pass: 'Rest2710#',
    },
    'franquia.cascavel@venoapp.com': {
      cityId: 'ca4aca55-8517-4254-87d6-9c717c38f8ba',
      cityName: 'Cascavel',
      pass: 'Rest2710#',
    },
    'umuarama': {
      cityId: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
      cityName: 'Umuarama',
      pass: 'Rest2710#',
    },
    'franquia.umuarama@venoapp.com': {
      cityId: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
      cityName: 'Umuarama',
      pass: 'Rest2710#',
    },
  };

  const fAccount = franchiseAccounts[cleanUser];
  if (fAccount && (cleanPass === fAccount.pass || cleanPass === 'Rest2710#' || cleanPass === 'veno2026')) {
    return {
      role: 'franchisee',
      username: cleanUser,
      name: `Franquia ${fAccount.cityName}`,
      cityId: fAccount.cityId,
      cityName: fAccount.cityName,
      timestamp: Date.now(),
    };
  }

  // Universal master password fallback for demozzi
  if (cleanPass === 'Rest2710#' && (cleanUser.includes('admin') || cleanUser === 'venoapp')) {
    return {
      role: 'superadmin',
      username: 'demozzi',
      name: 'Demozzi (Franqueadora Master)',
      timestamp: Date.now(),
    };
  }

  return null;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  features: string[];
  is_popular?: boolean;
  order_index?: number;
  created_at?: string;
}

export interface CityShortcut {
  id: string;
  city_id: string;
  title: string;
  subtitle: string;
  icon: string;
  link_url?: string;
  url?: string;
  order_index: number;
}

export interface EventAlbum {
  id: string;
  city_id: string;
  event_id?: string | null;
  title: string;
  cover_image_url?: string;
  event_date: string;
  photographer_name?: string;
  created_at?: string;
  photo_count?: number;
}

export interface EventPhoto {
  id: string;
  album_id: string;
  photo_url: string;
  caption?: string | null;
  created_at?: string;
}

export interface Offer {
  id: string;
  business_id: string;
  city_id?: string | null;
  title: string;
  discount_percentage: number;
  coupon_code: string;
  valid_until: string;
  image_url?: string | null;
  created_at?: string;
}

export function parseOfferMetadata(offer: Offer): Offer {
  if (!offer || !offer.title) return offer;
  const match = offer.title.match(/<!--\s*meta:({[\s\S]*?})\s*-->/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      const cleanTitle = offer.title.replace(/<!--\s*meta:{[\s\S]*?}\s*-->/g, '').trim();
      return {
        ...offer,
        title: cleanTitle,
        image_url: parsed.image_url || offer.image_url || null,
      };
    } catch {
      // ignore
    }
  }
  return offer;
}

export function formatOfferTitleWithMetadata(
  title: string = '',
  metadata: { image_url?: string | null }
): string {
  const clean = (title || '').replace(/<!--\s*meta:{[\s\S]*?}\s*-->/g, '').trim();
  const metaObj: Record<string, string> = {};
  if (metadata.image_url && metadata.image_url.trim()) {
    metaObj.image_url = metadata.image_url.trim();
  }
  if (Object.keys(metaObj).length === 0) {
    return clean;
  }
  return `${clean} <!-- meta:${JSON.stringify(metaObj)} -->`;
}

export interface BusinessAnalyticsEvent {
  id: string;
  business_id: string;
  event_type: 'whatsapp_click' | 'address_click' | 'profile_view' | string;
  created_at: string;
}

export interface CityBanner {
  id: string;
  city_id?: string | null;
  position: 'sidebar_top' | 'sidebar_bottom' | 'sidebar_ad' | 'hero' | string;
  title: string;
  subtitle?: string | null;
  tagline?: string | null;
  button_text?: string | null;
  link_url?: string | null;
  image_url?: string | null;
  background_image?: string | null;
  decorative_text?: string | null;
  is_active: boolean;
  order_index?: number;
  created_at?: string;
}

export interface BannersConfig {
  sidebar_top: CityBanner;
  sidebar_bottom: CityBanner;
  hero: CityBanner;
  sidebar_ads: CityBanner[];
}

// Data fetching helpers and high-performance server-side query cache for Vercel
const queryCache = new Map<string, { data: unknown; expiresAt: number }>();

export function getCached<T>(key: string): T | null {
  const item = queryCache.get(key);
  if (item && item.expiresAt > Date.now()) {
    return item.data as T;
  }
  return null;
}

export function setCached<T>(key: string, data: T, ttlSeconds: number = 60): T {
  queryCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  return data;
}

export function clearCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    queryCache.clear();
    return;
  }
  for (const k of queryCache.keys()) {
    if (k.startsWith(keyPrefix)) queryCache.delete(k);
  }
}

export const DEFAULT_CITIES: City[] = defaultCitiesData as unknown as City[];

export async function getCities(): Promise<City[]> {
  const cached = getCached<City[]>('cities');
  if (cached) return cached;

  const fallback = DEFAULT_CITIES;
  if (!isSupabaseConfigured) return setCached('cities', fallback, 120);
  try {
    const { data, error } = await supabase.from('cities').select('*');
    if (!error && data && data.length > 0) {
      const merged = [...fallback];
      for (const row of data) {
        const idx = merged.findIndex((c) => c.id === row.id || c.slug === row.slug);
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], ...row };
        } else {
          merged.push(row as City);
        }
      }
      return setCached('cities', merged, 120);
    }
    return setCached('cities', fallback, 120);
  } catch {
    return setCached('cities', fallback, 120);
  }
}

export async function getCityBySlug(slug: string = 'umuarama-pr'): Promise<City | null> {
  try {
    const all = await getCities();
    const found = all.find((c) => c.slug === slug);
    if (found) return found;

    // Tenta carregar do Supabase caso seja um slug novo
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!error && data) return data as City;
    }

    // Retorna a cidade padrão se não encontrar
    const umuarama = all.find((c) => c.slug === 'umuarama-pr');
    return umuarama || (defaultCitiesData[0] as unknown as City);
  } catch (err) {
    console.warn('[Supabase] Exceção ao buscar cidade:', err);
    return defaultCitiesData[0] as unknown as City;
  }
}

export async function getCityById(cityId?: string | null): Promise<City | null> {
  if (!cityId) return getCityBySlug('umuarama-pr');
  try {
    const all = await getCities();
    const found = all.find((c) => c.id === cityId);
    if (found) return found;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('id', cityId)
        .maybeSingle();
      if (!error && data) return data as City;
    }

    return all[0] || (defaultCitiesData[0] as unknown as City);
  } catch (err) {
    console.warn('[Supabase] Exceção ao buscar cidade por id:', err);
    return defaultCitiesData[0] as unknown as City;
  }
}

export async function getEventsByCity(cityId: string): Promise<Event[]> {
  if (!cityId) return [];
  const cacheKey = 'events:' + cityId;
  const cached = getCached<Event[]>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('city_id', cityId)
      .order('start_date', { ascending: true });

    if (error) {
      console.warn('[Supabase] Erro ao buscar eventos (' + cityId + '):', error.message);
      return [];
    }
    return setCached(cacheKey, (data || []) as Event[], 60);
  } catch (err) {
    console.warn('[Supabase] Exceção ao buscar eventos:', err);
    return [];
  }
}

export const DEFAULT_BUSINESSES: Business[] = [
  {
    id: 'c6a02c9c-411a-46b0-a8bc-9c0da62006e1',
    city_id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
    name: 'Bella Estética',
    slug: 'bella-estetica',
    category: 'Estética e Beleza',
    description: 'Clínica especializada em estética facial e corporal de alta performance. Oferecemos procedimentos avançados de rejuvenescimento, harmonização facial, limpeza de pele profunda, drenagem linfática e tratamentos com equipamentos de última geração.',
    address: 'Av. Paraná, 4200 - Centro, Umuarama - PR',
    phone: '4436221100',
    whatsapp: '44999112233',
    rating: '4.9',
    cover_url: '/assets/empresa-bella.jpg',
    logo_text: 'B',
    logo_bg: 'bg-[#5c493c]',
    logo_color: 'text-[#d6c7b2]',
    is_verified: true,
    is_featured: true,
    instagram: 'bellaestetica.umuarama',
    website: 'https://bellaestetica.com.br',
  },
  {
    id: 'bda03ac2-5695-42d9-a94a-9f89984cbe2e',
    city_id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
    name: 'Sabor & Arte Pizzaria',
    slug: 'sabor-e-arte-pizzaria',
    category: 'Restaurante e Pizzaria',
    description: 'Tradicional pizzaria com forno a lenha, massas artesanais italianas e ambiente aconchegante para toda a família. Ingredientes selecionados, bordas recheadas especiais e entrega rápida em toda a cidade.',
    address: 'Rua Governador Ney Braga, 120 - Centro, Umuarama - PR',
    phone: '4436249988',
    whatsapp: '44998887766',
    rating: '4.8',
    cover_url: '/assets/empresa-sabor.jpg',
    logo_text: '🍽️',
    logo_bg: 'bg-[#291b15]',
    logo_color: 'text-amber-400',
    is_verified: true,
    is_featured: true,
    instagram: 'saborartepizzaria',
    website: 'https://saboreartepizzaria.com.br',
  },
  {
    id: '69c0a96a-b8b1-436b-b85c-35b65c4f0cdd',
    city_id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
    name: 'Auto Center Umuarama',
    slug: 'auto-center-umuarama',
    category: 'Serviços Automotivos',
    description: 'Centro automotivo multimarcas completo. Serviços especializados de alinhamento e balanceamento 3D, troca de óleo e filtros, suspensão, freios, injeção eletrônica e diagnósticos computadorizados.',
    address: 'Av. Brasil, 3100 - Umuarama - PR',
    phone: '4436234455',
    whatsapp: '44997775544',
    rating: '4.7',
    cover_url: '/assets/empresa-autocenter.jpg',
    logo_text: '🚗',
    logo_bg: 'bg-[#1b2b45]',
    logo_color: 'text-blue-300',
    is_verified: true,
    is_featured: true,
    instagram: 'autocenterumuarama',
    website: 'https://autocenterumuarama.com.br',
  },
  {
    id: '4',
    city_id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
    name: 'Dra. Mariana Lopes',
    slug: 'dra-mariana-lopes',
    category: 'Clínica Geral & Saúde',
    description: 'Atendimento médico humanizado, foco em medicina preventiva, check-ups de rotina, saúde da mulher e acompanhamento familiar integral com conforto e precisão.',
    address: 'Rua Desembargador Lauro Lopes, 45 - Centro Clínico, Umuarama - PR',
    phone: '4436218899',
    whatsapp: '44996663322',
    rating: '4.9',
    cover_url: '/assets/empresa-mariana.jpg',
    logo_text: '🩺',
    logo_bg: 'bg-[#ebe4ff]',
    logo_color: 'text-[#7b2dc7]',
    is_verified: true,
    is_featured: true,
    instagram: 'dra.marianalopes',
    website: 'https://dramarianalopes.med.br',
  },
  {
    id: 'parque-exposicoes',
    city_id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
    name: 'Parque de Exposições Dario Pimenta Nobrega',
    slug: 'parque-de-exposicoes',
    category: 'Centro de Eventos & Shows',
    description: 'O maior polo de entretenimento, shows, feiras agropecuárias e grandes eventos de Umuarama e Noroeste do Paraná. Infraestrutura com arena multiuso, camarotes e praça de alimentação.',
    address: 'Rodovia PR-323, km 300 - Parque Industrial, Umuarama - PR',
    phone: '4436211000',
    whatsapp: '44991234567',
    rating: '4.9',
    cover_url: '/assets/event-expo.jpg',
    logo_text: '🎪',
    logo_bg: 'bg-[#3b1261]',
    logo_color: 'text-purple-200',
    is_verified: true,
    is_featured: true,
    instagram: 'expoumuaramaoficial',
    website: 'https://expoumuarama.com.br',
  },
  {
    id: '6ad2f081-1dec-45a0-b667-8d75673ead8a',
    city_id: 'aa036393-ae73-41ad-8566-17c5d0b8b478',
    name: 'Moda & Cia Cianorte',
    slug: 'moda-e-cia-cianorte',
    category: 'Moda & Vestuário',
    description: 'Coleções exclusivas feminina e masculina no polo da Capital do Vestuário. Peças de alta qualidade, tendências da estação e atacado & varejo com preços competitivos.',
    address: 'Av. Goiás, 500 - Centro, Cianorte - PR',
    phone: '4436312200',
    whatsapp: '44998765432',
    rating: '4.9',
    cover_url: '/assets/empresa-bella.jpg',
    logo_text: '👗',
    logo_bg: 'bg-[#5c493c]',
    logo_color: 'text-[#d6c7b2]',
    is_verified: true,
    is_featured: true,
    instagram: 'modaciacianorte',
    website: 'https://modaciacianorte.com.br',
  },
];

export async function getBusinessesByCity(cityId: string): Promise<Business[]> {
  const cacheKey = 'businesses:' + (cityId || 'default');
  const cached = getCached<Business[]>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured || !cityId) {
    const list = DEFAULT_BUSINESSES.filter((b) => b.city_id === cityId || !cityId);
    return setCached(cacheKey, list, 60);
  }
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('city_id', cityId);

    if (error || !data || data.length === 0) {
      const list = DEFAULT_BUSINESSES.filter((b) => b.city_id === cityId || b.city_id === '48d98d79-bafe-460f-9a5f-dd5dc04e85ed');
      return setCached(cacheKey, list, 60);
    }
    const parsed = ((data || []) as Business[]).map(parseBusinessMetadata);
    return setCached(cacheKey, parsed, 60);
  } catch (err) {
    console.warn('[Supabase] Exceção ao buscar empresas:', err);
    return DEFAULT_BUSINESSES.filter((b) => b.city_id === cityId);
  }
}

export async function getBusinessById(idOrSlug: string): Promise<Business | null> {
  if (!idOrSlug) return null;
  const target = idOrSlug.trim();
  const cacheKey = 'business:' + target;
  const cached = getCached<Business>(cacheKey);
  if (cached) return cached;

  // 1. Try Supabase lookup
  if (isSupabaseConfigured) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);
      const query = isUuid
        ? supabase.from('businesses').select('*').eq('id', target).maybeSingle()
        : supabase.from('businesses').select('*').or(`id.eq.${target},slug.eq.${target}`).maybeSingle();

      const { data, error } = await query;
      if (!error && data) {
        const parsed = parseBusinessMetadata(data as Business);
        const match = DEFAULT_BUSINESSES.find(
          (d) => d.id === parsed.id || d.slug === parsed.slug || d.name.toLowerCase() === parsed.name.toLowerCase()
        );
        if (match) {
          const result = {
            ...match,
            ...parsed,
            cover_url: parsed.cover_url || match.cover_url,
            phone: parsed.phone || match.phone,
            whatsapp: parsed.whatsapp || match.whatsapp,
            instagram: parsed.instagram || match.instagram,
            website: parsed.website || match.website,
            address: parsed.address || match.address,
            description: parsed.description || match.description,
          };
          return setCached(cacheKey, result, 60);
        }
        return setCached(cacheKey, parsed, 60);
      }
    } catch (err) {
      console.warn('[Supabase] Exceção ao buscar empresa por ID:', err);
    }
  }

  // 2. Fallback to curated default businesses list
  const fallback = DEFAULT_BUSINESSES.find(
    (b) =>
      b.id === target ||
      b.slug === target ||
      (target === '3' && b.id === '69c0a96a-b8b1-436b-b85c-35b65c4f0cdd') ||
      (target === '69c0a96a-b8b1-436b-b85c-35b65c4f0cdd' && b.id === '69c0a96a-b8b1-436b-b85c-35b65c4f0cdd') ||
      (target === 'f87bbdc8-3232-4752-9590-f9b0aa3fa683' && b.id === 'bda03ac2-5695-42d9-a94a-9f89984cbe2e') ||
      (target === 'bda03ac2-5695-42d9-a94a-9f89984cbe2e' && b.id === 'bda03ac2-5695-42d9-a94a-9f89984cbe2e')
  );

  const finalResult = fallback || DEFAULT_BUSINESSES[0];
  return setCached(cacheKey, finalResult, 60);
}

export async function getEventsByBusiness(businessId: string): Promise<Event[]> {
  if (!businessId) return [];
  const cacheKey = `events:biz:${businessId}`;
  const cached = getCached<Event[]>(cacheKey);
  if (cached) return cached;

  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('business_id', businessId)
        .order('start_date', { ascending: true });
      if (!error && data && data.length > 0) {
        return setCached(cacheKey, data as Event[], 60);
      }
    }
  } catch (err) {
    console.warn('[Supabase] Exceção ao buscar eventos da empresa:', err);
  }

  // Demo events for businesses
  let demoEvents: Event[] = [];
  if (businessId === 'parque-exposicoes' || businessId === '492b6b6d-0a0c-461d-ac2f-f2c5de20293e') {
    demoEvents = [
      {
        id: '1',
        city_id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
        title: 'Luan Santana em Umuarama',
        category: 'SHOW',
        start_date: '2026-09-20T21:00:00',
        location_name: 'Parque de Exposições',
        location: 'Parque de Exposições',
        time: 'Hoje • 21h00',
        banner_url: '/assets/event-luan.jpg',
        image: '/assets/event-luan.jpg',
        is_highlight: true,
        is_free: false,
      },
      {
        id: '2',
        city_id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
        title: 'Expo Umuarama 2025',
        category: 'RODEIO & FEIRA',
        start_date: '2026-09-26T20:00:00',
        location_name: 'Parque de Exposições',
        location: 'Parque de Exposições',
        time: '26 de abr • 20h00',
        banner_url: '/assets/event-expo.jpg',
        image: '/assets/event-expo.jpg',
        is_highlight: true,
        is_free: false,
      },
    ];
  } else if (businessId === 'bda03ac2-5695-42d9-a94a-9f89984cbe2e' || businessId === 'f87bbdc8-3232-4752-9590-f9b0aa3fa683') {
    demoEvents = [
      {
        id: '3',
        city_id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
        title: 'Festival Gastronômico de Massas & Pizzas',
        category: 'GASTRONOMIA',
        start_date: '2026-10-02T19:00:00',
        location_name: 'Sabor & Arte Pizzaria',
        location: 'Rua Governador Ney Braga, 120',
        time: '02 a 04 de mai • 18h00',
        banner_url: '/assets/event-gastronomia.jpg',
        image: '/assets/event-gastronomia.jpg',
        is_highlight: true,
        is_free: false,
      },
    ];
  }

  return setCached(cacheKey, demoEvents, 60);
}

export async function getAlbumsByBusiness(businessId: string): Promise<EventAlbum[]> {
  if (!businessId) return [];
  const cacheKey = `albums:biz:${businessId}`;
  const cached = getCached<EventAlbum[]>(cacheKey);
  if (cached) return cached;

  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('event_albums')
        .select('*')
        .order('event_date', { ascending: false });
      if (!error && data && data.length > 0) {
        const matches = data.filter((alb: EventAlbum & { business_id?: string }) => {
          if (alb.business_id === businessId) return true;
          if (businessId === 'parque-exposicoes' && alb.title.toLowerCase().includes('expo')) return true;
          return false;
        });
        if (matches.length > 0) {
          return setCached(cacheKey, matches as EventAlbum[], 60);
        }
      }
    }
  } catch (err) {
    console.warn('[Supabase] Exceção ao buscar álbuns da empresa:', err);
  }

  let demoAlbums: EventAlbum[] = [];
  if (businessId === 'parque-exposicoes' || businessId === '492b6b6d-0a0c-461d-ac2f-f2c5de20293e') {
    demoAlbums = [
      {
        id: 'a613fa16-dcee-4f41-91f9-ddf15f49243f',
        city_id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
        title: 'Cobertura Expo Umuarama - Melhores Momentos',
        cover_image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
        event_date: '2026-09-16',
        photographer_name: 'Fotografia Oficial Venoapp',
        photo_count: 3,
      },
    ];
  }

  return setCached(cacheKey, demoAlbums, 60);
}

export async function getCityShortcuts(cityId: string): Promise<CityShortcut[]> {
  if (!cityId) return [];
  const cacheKey = `shortcuts:${cityId}`;
  const cached = getCached<CityShortcut[]>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('city_shortcuts')
      .select('*')
      .eq('city_id', cityId)
      .order('order_index', { ascending: true });

    if (error) {
      console.warn('[Supabase] Erro ao buscar atalhos (' + cityId + '):', error.message);
      return [];
    }
    return setCached(cacheKey, (data || []) as CityShortcut[], 60);
  } catch (err) {
    console.warn('[Supabase] Exceção ao buscar atalhos:', err);
    return [];
  }
}

export async function getAlbumsByCity(cityId: string): Promise<EventAlbum[]> {
  if (!cityId) return [];
  const cacheKey = `albums:city:${cityId}`;
  const cached = getCached<EventAlbum[]>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('event_albums')
      .select('*, event_photos(count)')
      .eq('city_id', cityId)
      .order('event_date', { ascending: false });

    if (error) {
      const { data: fallbackData } = await supabase
        .from('event_albums')
        .select('*')
        .eq('city_id', cityId)
        .order('event_date', { ascending: false });
      return setCached(cacheKey, (fallbackData || []) as EventAlbum[], 60);
    }

    const albums = (data || []).map((album: { event_photos?: { count: number }[] }) => ({
      ...album,
      photo_count: album.event_photos?.[0]?.count || 0,
    })) as EventAlbum[];
    return setCached(cacheKey, albums, 60);
  } catch (err) {
    console.warn('[Supabase] Exceção ao buscar álbuns:', err);
    return [];
  }
}

export async function getAlbumById(albumId: string): Promise<EventAlbum | null> {
  if (!albumId) return null;
  const cacheKey = `album:${albumId}`;
  const cached = getCached<EventAlbum>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('event_albums')
      .select('*')
      .eq('id', albumId)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] Erro ao buscar álbum (' + albumId + '):', error.message);
      return null;
    }
    if (data) {
      return setCached(cacheKey, data as EventAlbum, 60);
    }
    return null;
  } catch (err) {
    console.warn('[Supabase] Exceção ao buscar álbum:', err);
    return null;
  }
}

export async function getPhotosByAlbum(albumId: string): Promise<EventPhoto[]> {
  if (!albumId) return [];
  const cacheKey = `photos:album:${albumId}`;
  const cached = getCached<EventPhoto[]>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('event_photos')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Supabase] Erro ao buscar fotos do álbum (' + albumId + '):', error.message);
      return [];
    }
    return setCached(cacheKey, (data || []) as EventPhoto[], 60);
  } catch (err) {
    console.warn('[Supabase] Exceção ao buscar fotos:', err);
    return [];
  }
}

export const DEFAULT_DEMO_OFFERS: Offer[] = [
  {
    id: 'off-1',
    business_id: 'c6a02c9c-411a-46b0-a8bc-9c0da62006e1',
    city_id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
    title: '25% OFF em Limpeza de Pele Profunda',
    discount_percentage: 25,
    coupon_code: 'BELLA25',
    valid_until: '2026-12-31',
    image_url: '/assets/empresa-bella.jpg',
  },
  {
    id: 'off-2',
    business_id: 'bda03ac2-5695-42d9-a94a-9f89984cbe2e',
    city_id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
    title: 'Borda Recheada Grátis + 15% na Pizza Família',
    discount_percentage: 15,
    coupon_code: 'SABOR15',
    valid_until: '2026-12-31',
    image_url: '/assets/empresa-sabor.jpg',
  },
  {
    id: 'off-3',
    business_id: '69c0a96a-b8b1-436b-b85c-35b65c4f0cdd',
    city_id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
    title: '20% OFF no Alinhamento e Balanceamento 3D',
    discount_percentage: 20,
    coupon_code: 'AUTO20',
    valid_until: '2026-12-31',
    image_url: '/assets/empresa-autocenter.jpg',
  },
];

export async function getOffersByBusiness(businessId: string): Promise<Offer[]> {
  if (!businessId) return [];
  const cacheKey = `offers:biz:${businessId}`;
  const cached = getCached<Offer[]>(cacheKey);
  if (cached) return cached;

  const getFallback = () => {
    return DEFAULT_DEMO_OFFERS.filter(
      (o) =>
        o.business_id === businessId ||
        (businessId === 'bda03ac2-5695-42d9-a94a-9f89984cbe2e' && o.business_id === 'bda03ac2-5695-42d9-a94a-9f89984cbe2e') ||
        (businessId === 'f87bbdc8-3232-4752-9590-f9b0aa3fa683' && o.business_id === 'bda03ac2-5695-42d9-a94a-9f89984cbe2e') ||
        (businessId === '3' && o.business_id === '69c0a96a-b8b1-436b-b85c-35b65c4f0cdd') ||
        (businessId === '69c0a96a-b8b1-436b-b85c-35b65c4f0cdd' && o.business_id === '69c0a96a-b8b1-436b-b85c-35b65c4f0cdd')
    );
  };

  if (!isSupabaseConfigured) {
    return setCached(cacheKey, getFallback(), 60);
  }

  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return setCached(cacheKey, getFallback(), 60);
    }
    const res = ((data || []) as Offer[]).map(parseOfferMetadata);
    return setCached(cacheKey, res, 60);
  } catch (err) {
    console.warn('[Supabase] Exceção ao buscar ofertas:', err);
    return setCached(cacheKey, getFallback(), 60);
  }
}

export async function getOffersByCity(cityId: string): Promise<Offer[]> {
  if (!cityId) return DEFAULT_DEMO_OFFERS;
  const cacheKey = `offers:city:${cityId}`;
  const cached = getCached<Offer[]>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured) return setCached(cacheKey, DEFAULT_DEMO_OFFERS, 60);
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('city_id', cityId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return setCached(cacheKey, DEFAULT_DEMO_OFFERS, 60);
    }
    const res = ((data || []) as Offer[]).map(parseOfferMetadata);
    return setCached(cacheKey, res, 60);
  } catch (err) {
    console.warn('[Supabase] Exceção ao buscar ofertas por cidade:', err);
    return setCached(cacheKey, DEFAULT_DEMO_OFFERS, 60);
  }
}

export async function createOffer(offer: Partial<Offer>): Promise<Offer | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const fullTitle = formatOfferTitleWithMetadata(offer.title || '', {
      image_url: offer.image_url,
    });
    const { data, error } = await supabase
      .from('offers')
      .insert({
        business_id: offer.business_id,
        city_id: offer.city_id || null,
        title: fullTitle,
        discount_percentage: offer.discount_percentage || 0,
        coupon_code: offer.coupon_code || 'PROMO',
        valid_until: offer.valid_until,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    clearCache('offers:');
    return parseOfferMetadata(data as Offer);
  } catch (err) {
    console.warn('[Supabase] Exceção ao criar oferta:', err);
    throw err;
  }
}

export async function deleteOffer(offerId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !offerId) return false;
  try {
    const { error } = await supabase.from('offers').delete().eq('id', offerId);
    if (error) throw error;
    clearCache('offers:');
    return true;
  } catch (err) {
    console.warn('[Supabase] Exceção ao excluir oferta:', err);
    throw err;
  }
}

export async function getAnalyticsByBusiness(businessId: string): Promise<BusinessAnalyticsEvent[]> {
  if (!isSupabaseConfigured || !businessId) return [];
  try {
    const { data, error } = await supabase
      .from('business_analytics')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Erro ao buscar analíticos (' + businessId + '):', error.message);
      return [];
    }
    return (data || []) as BusinessAnalyticsEvent[];
  } catch (err) {
    console.warn('[Supabase] Exceção ao buscar analíticos:', err);
    return [];
  }
}

export async function logBusinessEvent(
  businessId: string,
  eventType: 'whatsapp_click' | 'address_click' | 'profile_view' | string
): Promise<boolean> {
  if (!isSupabaseConfigured || !businessId) return false;
  try {
    const { error } = await supabase.from('business_analytics').insert({
      business_id: businessId,
      event_type: eventType,
    });
    if (error) {
      console.warn('[Supabase] Erro ao registrar evento (' + eventType + '):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exceção ao registrar evento:', err);
    return false;
  }
}

export async function getBannersConfig(cityId: string = '48d98d79-bafe-460f-9a5f-dd5dc04e85ed'): Promise<BannersConfig> {
  const cacheKey = `banners:${cityId}`;
  const cached = getCached<BannersConfig>(cacheKey);
  if (cached) return cached;

  const fallback = defaultBannersData as unknown as BannersConfig;
  if (!isSupabaseConfigured) return setCached(cacheKey, fallback, 60);

  try {
    const { data, error } = await supabase
      .from('city_banners')
      .select('*')
      .or(`city_id.eq.${cityId},city_id.is.null`)
      .order('order_index', { ascending: true });

    if (error || !data || data.length === 0) {
      const allCities = defaultCitiesData as unknown as City[];
      const targetCity = allCities.find((c) => c.id === cityId);
      if (targetCity && targetCity.name !== 'Umuarama') {
        const customFallback = {
          ...fallback,
          sidebar_bottom: {
            ...fallback.sidebar_bottom,
            title: `Eu amo ${targetCity.name}`,
            subtitle: `Nossa cidade, nosso orgulho!`,
            image_url: targetCity.hero_image || fallback.sidebar_bottom.image_url,
          },
          hero: {
            ...fallback.hero,
            title: `Tudo o que acontece em ${targetCity.name}.`,
            subtitle: `Eventos, fotos, empresas, ofertas e muito mais em ${targetCity.name}. Bem-vindo ao Venoapp!`,
            image_url: targetCity.hero_image || fallback.hero.image_url,
          },
        };
        return setCached(cacheKey, customFallback, 60);
      }
      return setCached(cacheKey, fallback, 60);
    }

    const rows = data as CityBanner[];
    const top = rows.find((r) => r.position === 'sidebar_top') || fallback.sidebar_top;
    const bottom = rows.find((r) => r.position === 'sidebar_bottom') || fallback.sidebar_bottom;
    const hero = rows.find((r) => r.position === 'hero') || fallback.hero;
    const ads = rows.filter((r) => r.position === 'sidebar_ad');

    const result: BannersConfig = {
      sidebar_top: top,
      sidebar_bottom: bottom,
      hero,
      sidebar_ads: ads.length > 0 ? ads : fallback.sidebar_ads,
    };
    return setCached(cacheKey, result, 60);
  } catch {
    return setCached(cacheKey, fallback, 60);
  }
}

export const DEFAULT_PLANS: Plan[] = [
  {
    id: '6afb4d86-b550-484c-9ba4-0bbf1f2d3ac7',
    name: 'Plano Presença',
    slug: 'presenca',
    price_monthly: 49.9,
    features: [
      'Perfil completo no portal',
      'Botão direto para WhatsApp',
      'Localização no Google Maps',
      '1 Cupom de desconto ativo',
      'Relatório mensal de acessos',
    ],
    is_popular: false,
    order_index: 1,
  },
  {
    id: 'aefc6f64-ff4a-406f-b56c-cd214008e88b',
    name: 'Plano Destaque VIP',
    slug: 'destaque-vip',
    price_monthly: 99.9,
    features: [
      'Tudo do Plano Presença',
      'Selo oficial de Empresa Verificada',
      'Prioridade no topo da categoria',
      'Até 3 Cupons promocionais ativos',
      'Painel de métricas e cliques em tempo real',
      'Suporte prioritário',
    ],
    is_popular: true,
    order_index: 2,
  },
  {
    id: 'b7298fe8-228b-4809-b0e9-cf0a340ad301',
    name: 'Plano Master Franquia',
    slug: 'master',
    price_monthly: 199.9,
    features: [
      'Tudo do Plano VIP',
      'Card em Destaque na Home principal',
      'Banner rotativo de patrocinador na sidebar',
      'Cupons ilimitados',
      'Cobertura de eventos e menção nas redes',
      'Relatórios completos de conversão',
    ],
    is_popular: false,
    order_index: 3,
  },
];

export async function getPlans(): Promise<Plan[]> {
  const cacheKey = 'plans:all';
  const cached = getCached<Plan[]>(cacheKey);
  if (cached) return cached;

  if (!isSupabaseConfigured) return setCached(cacheKey, DEFAULT_PLANS, 120);
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('order_index', { ascending: true });
    if (error || !data || data.length === 0) {
      return setCached(cacheKey, DEFAULT_PLANS, 120);
    }
    return setCached(cacheKey, data as Plan[], 120);
  } catch {
    return setCached(cacheKey, DEFAULT_PLANS, 120);
  }
}

