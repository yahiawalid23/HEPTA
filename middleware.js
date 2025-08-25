import { NextResponse } from 'next/server';

export function middleware(req) {
  const url = req.nextUrl.clone();

  // Redirect root to /products
  if (url.pathname === '/') {
    url.pathname = '/products';
    return NextResponse.redirect(url);
  }

  // Existing admin auth
  if (url.pathname.startsWith('/admin')) {
    const cookie = req.cookies.get('admin-auth');
    if (!cookie || cookie.value !== 'true') {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}