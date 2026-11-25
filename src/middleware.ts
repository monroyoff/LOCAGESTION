import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Règle d'or Android App Links : Ne JAMAIS rediriger .well-known (doit renvoyer HTTP 200 direct)
  if (pathname.startsWith('/.well-known/')) {
    return NextResponse.next();
  }

  // Si une requête arrive sur www.locagestion.site, redirection canonique 301 vers le domaine apex pour le SEO
  const host = request.headers.get('host') || '';
  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone();
    url.host = host.replace(/^www\./, '');
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
