import React from 'react';
import { cookies } from 'next/headers';
import { getCityBySlug, getCities, getEventsByCity, City } from '@/lib/supabase';
import { EventosAgendaView } from './EventosAgendaView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ cidade?: string }>;
}

export default async function EventosPage({ searchParams }: PageProps) {
  const { cidade } = await searchParams;
  const cookieStore = await cookies();
  const cookieCity = cookieStore.get('venoapp_city')?.value;

  const targetSlug = cidade || cookieCity || 'umuarama-pr';

  const [allCities, cityBySlug] = await Promise.all([
    getCities(),
    getCityBySlug(targetSlug),
  ]);

  const activeCity: City = cityBySlug || allCities[0] || {
    id: '48d98d79-bafe-460f-9a5f-dd5dc04e85ed',
    name: 'Umuarama',
    slug: 'umuarama-pr',
    state: 'PR',
    headline: 'Tudo o que acontece na sua cidade.',
    hero_image: '/assets/hero-new-full.jpg',
  };

  const events = await getEventsByCity(activeCity.id);

  return (
    <EventosAgendaView
      city={activeCity}
      allCities={allCities}
      events={events}
    />
  );
}
