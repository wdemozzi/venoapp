import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured, Plan, DEFAULT_PLANS } from '@/lib/supabase';
import initialPlans from '@/data/plans.json';

const plansFilePath = path.join(process.cwd(), 'src', 'data', 'plans.json');

function getLocalPlans(): Plan[] {
  try {
    if (fs.existsSync(plansFilePath)) {
      const raw = fs.readFileSync(plansFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Erro ao ler plans.json:', err);
  }
  return initialPlans as unknown as Plan[];
}

function saveLocalPlans(plans: Plan[]): boolean {
  try {
    fs.writeFileSync(plansFilePath, JSON.stringify(plans, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erro ao salvar plans.json:', err);
    return false;
  }
}

export async function GET() {
  const local = getLocalPlans();
  return NextResponse.json(local);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const localPlans = getLocalPlans();

    // Handle delete action
    if (body.action === 'delete' && body.id) {
      const updated = localPlans.filter((p) => p.id !== body.id);
      saveLocalPlans(updated);
      if (isSupabaseConfigured) {
        try {
          await supabase.from('plans').delete().eq('id', body.id);
        } catch {}
      }
      return NextResponse.json({ success: true, plans: updated });
    }

    if (!body.name) {
      return NextResponse.json({ error: 'Nome do plano é obrigatório.' }, { status: 400 });
    }

    const planId = body.id || ('plan-' + Date.now());
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const price = Number(body.price_monthly || 0);
    const orderIndex = Number(body.order_index || (localPlans.length + 1));
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

    const existingIdx = localPlans.findIndex((p) => p.id === planId);
    let updatedPlans: Plan[] = [];
    if (existingIdx >= 0) {
      updatedPlans = [...localPlans];
      updatedPlans[existingIdx] = planData;
    } else {
      updatedPlans = [...localPlans, planData];
    }

    // Sort by order_index
    updatedPlans.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    saveLocalPlans(updatedPlans);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('plans').upsert({
          id: planData.id,
          name: planData.name,
          slug: planData.slug,
          price_monthly: planData.price_monthly,
          features: planData.features,
          is_popular: planData.is_popular,
          order_index: planData.order_index,
        });
      } catch (err) {
        console.warn('Erro ao sincronizar plano no Supabase:', err);
      }
    }

    return NextResponse.json({ success: true, plan: planData, plans: updatedPlans });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno ao salvar plano';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
