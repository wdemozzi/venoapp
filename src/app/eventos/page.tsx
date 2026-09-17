import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const revalidate = 60;

export default async function EventosPage() {
  const cookieStore = await cookies();
  const citySlug = cookieStore.get('venoapp_city')?.value || 'umuarama-pr';
  redirect('/' + citySlug + '#eventos');
}
