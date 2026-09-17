import { notFound } from "next/navigation";
import { getCityBySlug, getCities } from "@/lib/supabase";
import { CityPortal } from "@/components/CityPortal";

export const revalidate = 60;

interface CityPageProps {
  params: Promise<{
    citySlug: string;
  }>;
}

export async function generateStaticParams() {
  const allCities = await getCities();
  return allCities.map((city) => ({
    citySlug: city.slug,
  }));
}

export default async function CityPage({ params }: CityPageProps) {
  const { citySlug } = await params;

  const allCities = await getCities();
  const city = allCities.find((c) => c.slug === citySlug) || (await getCityBySlug(citySlug));

  if (!city) {
    notFound();
  }

  return <CityPortal city={city} allCities={allCities} />;
}
