import { cookies } from "next/headers";
import { getCityBySlug, getCities } from "@/lib/supabase";
import { CityPortal } from "@/components/CityPortal";

export const revalidate = 60;

export default async function Home() {
  const cookieStore = await cookies();
  const savedCitySlug = cookieStore.get("venoapp_city")?.value || "umuarama-pr";

  const allCities = await getCities();
  const city = (await getCityBySlug(savedCitySlug)) || allCities[0];

  return <CityPortal city={city} allCities={allCities} />;
}
