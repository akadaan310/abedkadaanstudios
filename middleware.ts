import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    if (pathname === "/") {
      const headers = new Headers(request.headers);
      headers.set("x-site-type", "portfolio");
      return NextResponse.next({ request: { headers } });
    }

    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next")
    ) {
      return NextResponse.next();
    }

    const slug = pathname.split("/")[1];
    const headers = new Headers(request.headers);
    headers.set("x-business-slug", slug);
    return NextResponse.rewrite(new URL("/", request.url), { request: { headers } });
  }

  const host = request.headers.get("host") ?? "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN!;

  if (host.startsWith("dashboardx")) {
    const url = request.nextUrl.clone();
    url.pathname = url.pathname === "/" ? "/dashboard" : `/dashboard${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (host === appDomain || host === `www.${appDomain}`) {
    const headers = new Headers(request.headers);
    headers.set('x-site-type', 'portfolio');
    return NextResponse.next({ request: { headers } });
  }

  if (host.endsWith(`.${appDomain}`)) {
    const slug = host.slice(0, host.indexOf(`.${appDomain}`));
    const response = NextResponse.next();
    response.headers.set("x-business-slug", slug);
    return response;
  }

  // custom domain
  const response = NextResponse.next();
  response.headers.set("x-custom-domain", host);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
