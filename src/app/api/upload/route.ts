import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Validate type
    const mimeType = file.type;
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedMimes.includes(mimeType) && !mimeType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Formato de imagem inválido. Use JPG, PNG, WEBP ou GIF.' },
        { status: 400 }
      );
    }

    // Determine extension
    let ext = 'jpg';
    if (mimeType === 'image/png') ext = 'png';
    else if (mimeType === 'image/webp') ext = 'webp';
    else if (mimeType === 'image/gif') ext = 'gif';
    else if (mimeType === 'image/svg+xml') ext = 'svg';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const filename = `img-${uniqueId}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar upload';
    console.error('Upload error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
