import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured, Plan, DEFAULT_PLANS, clearCache } from '@/lib/supabase';
import initialPlans from '@/data/plans.json';

export const dynamic = 'force-dynamic';

async function fetchAllPlans(): Promise<Plan[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Plan[];
      }
    } catch (err) {
      console.warn('[API /api/plans] Falha ao consultar Supabase:', err);
    }
  }
  return initialPlans as unknown as Plan[];
}

export async function GET() {
  const plans = await fetchAllPlans();
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    // Handle delete action
    if (body.action === 'delete' && body.id) {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('plans').delete().eq('id', body.id);
        if (error) {
          return NextResponse.json({ error: 'Erro ao excluir plano: ' + error.message }, { status: 500 });
        }
      }

      clearCache('plans:');
      try {
        revalidatePath('/anunciar', 'layout');
        revalidatePath('/', 'layout');
        revalidatePath('/[citySlug]', 'layout');
      } catch {}

      const updatedPlans = await fetchAllPlans();
      return NextResponse.json({ success: true, plans: updatedPlans });
    }

    if (!body.name) {
      return NextResponse.json({ error: 'Nome do plano é obrigatório.' }, { status: 400 });
    }

    // Ensure valid UUID for id if generating a new one
    let planId = body.id;
    if (!planId || planId.startsWith('plan-')) {
      planId = crypto.randomUUID();
    }

    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const price = Number(body.price_monthly || 0);
    const orderIndex = Number(body.order_index || 1);
    const isPopular = Boolean(body.is_popular);
    const features: string[] = Array.isArray(body.features)
      ? body.features
      : typeof body.features === 'string'
      ? body.features.split('\n').map((f: string) => f.trim()).filter(Boolean)
      : [];

    const planData: Plan = {
      id: planId,
      name: body.name.trim(),
      slug,
      price_monthly: price,
      features,
      is_popular: isPopular,
      order_index: orderIndex,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('plans')
        .upsert({
          id: planData.id,
          name: planData.name,
          slug: planData.slug,
          price_monthly: planData.price_monthly,
          features: planData.features,
          is_popular: planData.is_popular,
          order_index: planData.order_index,
        })
        .select();

      if (error) {
        console.error('[API /api/plans] Erro no upsert Supabase:', error);
        return NextResponse.json(
          { error: `Erro no Supabase ao salvar plano: ${error.message}. Certifique-se de executar o script SQL para liberar permissões RLS.` },
          { status: 500 }
        );
      }
      if (data && data[0]) {
        planData.id = data[0].id;
      }
    }

    clearCache('plans:');
    try {
      revalidatePath('/anunciar', 'layout');
      revalidatePath('/', 'layout');
      revalidatePath('/[citySlug]', 'layout');
    } catch {}

    const updatedPlans = await fetchAllPlans();
    return NextResponse.json({ success: true, plan: planData, plans: updatedPlans });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno ao salvar plano';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
