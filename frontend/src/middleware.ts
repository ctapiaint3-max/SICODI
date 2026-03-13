import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sicodi_token')?.value;
  const path = request.nextUrl.pathname;
  
  const isLoginPage = path === '/login';
  const isRecoverPage = path === '/recuperar';

  // Bypass: No redirigir al login si falta el token
  /*
  if (!isLoginPage && !isRecoverPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  */

  // Si trata de entrar a login o recuperar estando ya logueado
  if ((isLoginPage || isRecoverPage) && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configuración para que el middleware corra en TODAS las rutas de UI excluyendo asets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - image files (.jpg, .png, .svg, .ico, .webp)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\.(?:jpg|jpeg|png|gif|svg|webp|ico)).*)',
  ],
};
