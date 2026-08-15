import { auth } from "~/auth";

const PROTECTED_PATHS = ["/profile", "/settings", "/create", "/submit"];

export const proxy = auth((req) => {
  const { nextUrl, auth: session } = req;

  const isProtected = PROTECTED_PATHS.some(
    (path) =>
      nextUrl.pathname === path || nextUrl.pathname.startsWith(`${path}/`),
  );

  if (isProtected && !session?.user) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  return undefined;
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images).*)",
  ],
};
