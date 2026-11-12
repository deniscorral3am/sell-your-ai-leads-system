import { NextResponse, type NextRequest } from 'next/server';

// El panel solo corre en tu ordenador. Además de escuchar en 127.0.0.1, rechaza cualquier
// petición cuyo Host no sea 127.0.0.1 o localhost: así una web maliciosa no puede usar
// DNS rebinding para leer tus leads o el QR de WhatsApp desde tu navegador.
const LOCAL = new Set(['127.0.0.1', 'localhost', '[::1]']);

export function proxy(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase().replace(/:\d+$/, '');
  if (!LOCAL.has(host)) return new NextResponse('Solo en local', { status: 403 });
  const res = NextResponse.next();
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
