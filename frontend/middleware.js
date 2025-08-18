import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Redirecionar /login para /login/coinage
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/login/coinage', request.url));
  }
  
  // Redirecionar /register para /register/coinage
  if (pathname === '/register') {
    return NextResponse.redirect(new URL('/register/coinage', request.url));
  }
  
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/change-password', '/register'];
  
  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Se for rota pública, permitir acesso
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Para rotas protegidas, o redirecionamento será feito na empresa
  // pois precisamos verificar o estado do Zustand
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
