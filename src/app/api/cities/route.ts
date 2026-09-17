import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured, City } from '@/lib/supabase';
import initialCities from '@/data/cities.json';

import crypto from 'crypto';

const citiesFilePath = path.join(process.cwd(), 'src', 'data', 'cities.json');

function getLocalCities(): City[] {
  try {
    if (fs.existsSync(citiesFilePath)) {
      const raw = fs.readFileSync(citiesFilePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erro ao ler cities.json:', err);
  }
  return initialCities as unknown as City[];
}

function saveLocalCities(cities: City[]): boolean {
  try {
    fs.writeFileSync(citiesFilePath, JSON.stringify(cities, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erro ao salvar cities.json:', err);
    return false;
  }
}

export async function GET() {
  const local = getLocalCities();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('cities').select('*');
      if (!error && data && data.length > 0) {
        // Merge Supabase with local (local has franchisee details if not in DB)
        const merged = [...local];
        for (const row of data) {
          const index = merged.findIndex((c) => c.id === row.id || c.slug === row.slug);
          if (index >= 0) {
            merged[index] = { ...merged[index], ...row };
          } else {
            merged.push(row as City);
          }
        }
        return NextResponse.json(merged);
      }
    } catch (err) {
      console.warn('Erro ao carregar cidades do Supabase, usando local:', err);
    }
  }

  return NextResponse.json(local);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.name || !body.state) {
      return NextResponse.json({ error: 'Nome e UF são obrigatórios.' }, { status: 400 });
    }

    const localCities = getLocalCities();
    const cleanSlug =
      body.slug ||
      body.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
        '-' +
        body.state.toLowerCase();

    const existingIndex = localCities.findIndex(
      (c) => (body.id && c.id === body.id) || c.slug === cleanSlug
    );

    const newCity: City = {
      id: body.id || (existingIndex >= 0 ? localCities[existingIndex].id : crypto.randomUUID()),
      slug: cleanSlug,
      name: body.name.trim(),
      state: body.state.trim().toUpperCase(),
      headline: body.headline || `Tudo o que acontece em ${body.name}.`,
      hero_image:
        body.hero_image ||
        'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&q=80&w=1600',
      franchisee_name: body.franchisee_name || '',
      franchisee_email: body.franchisee_email || '',
      franchisee_phone: body.franchisee_phone ? body.franchisee_phone.replace(/\D/g, '') : '',
      status: body.status || 'active',
      created_at:
        existingIndex >= 0 && localCities[existingIndex].created_at
          ? localCities[existingIndex].created_at
          : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      localCities[existingIndex] = newCity;
    } else {
      localCities.push(newCity);
    }

    saveLocalCities(localCities);

    // Sync to Supabase if table exists
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('cities').upsert({
          id: newCity.id,
          slug: newCity.slug,
          name: newCity.name,
          state: newCity.state,
        });
        if (error) {
          console.warn('[Supabase Sync Warning]', error.message);
        }
      } catch (dbErr) {
        console.warn('[Supabase Sync Exception]', dbErr);
      }
    }

    return NextResponse.json({ success: true, city: newCity, cities: localCities });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar requisição';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
