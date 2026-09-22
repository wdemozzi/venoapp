import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { clearCache } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetPath = body.path || '/';

    // Clear server-side in-memory cache
    clearCache();

    // Revalidate paths on-demand
    if (targetPath && targetPath !== '/') {
      revalidatePath(targetPath, 'layout');
    }
    revalidatePath('/', 'layout');
    revalidatePath('/[citySlug]', 'layout');
    revalidatePath('/anunciar', 'layout');
    revalidatePath('/empresas', 'layout');
    revalidatePath('/eventos', 'layout');
    revalidatePath('/explorar', 'layout');

    return NextResponse.json({
      revalidated: true,
      path: targetPath,
      now: Date.now(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao revalidar cache';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetPath = searchParams.get('path') || '/';

    clearCache();

    if (targetPath && targetPath !== '/') {
      revalidatePath(targetPath, 'layout');
    }
    revalidatePath('/', 'layout');
    revalidatePath('/[citySlug]', 'layout');
    revalidatePath('/anunciar', 'layout');
    revalidatePath('/empresas', 'layout');
    revalidatePath('/eventos', 'layout');

    return NextResponse.json({
      revalidated: true,
      path: targetPath,
      now: Date.now(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao revalidar cache';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
