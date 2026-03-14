import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_ROLE, isProfileRole, isStaffRole } from "@/lib/auth/roles";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/auth/callback",
  "/auth/verify-email",
  "/forgot-password",
  "/reset-password",
  "/api/health",
];

const BORROWER_ONLY_ROUTES = ["/my-loans", "/api/my-loans"];
const STAFF_ONLY_ROUTES = [
  "/dashboard",
  "/pipeline",
  "/communications",
  "/loans",
  "/api/pipeline",
  "/api/communications",
  "/api/compliance",
];

function isApiRoute(pathName: string) {
  return pathName.startsWith("/api/");
}

function matchesRoute(pathName: string, route: string) {
  if (route === "/") {
    return pathName === "/";
  }
  return pathName === route || pathName.startsWith(`${route}/`);
}

function matchesAnyRoute(pathName: string, routes: readonly string[]) {
  return routes.some((route) => matchesRoute(pathName, route));
}

function isStaffOnlyLoanApi(pathName: string) {
  if (!pathName.startsWith("/api/loans/")) {
    return false;
  }

  return (
    pathName.includes("/compliance") ||
    pathName.includes("/disclosures/reminders")
  );
}

function unauthorizedResponse(request: NextRequest) {
  if (isApiRoute(request.nextUrl.pathname)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

function forbiddenResponse(request: NextRequest, redirectPath: string) {
  if (isApiRoute(request.nextUrl.pathname)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.redirect(new URL(redirectPath, request.url));
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathName = request.nextUrl.pathname;
  const isPublic = matchesAnyRoute(pathName, PUBLIC_ROUTES);
  const isBorrowerOnly = matchesAnyRoute(pathName, BORROWER_ONLY_ROUTES);
  const isStaffOnly =
    matchesAnyRoute(pathName, STAFF_ONLY_ROUTES) || isStaffOnlyLoanApi(pathName);

  if (!user && !isPublic) {
    return unauthorizedResponse(request);
  }

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      if (isApiRoute(pathName)) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = isProfileRole(profile?.role) ? profile.role : DEFAULT_ROLE;
    const userIsBorrower = role === "borrower";
    const userIsStaff = isStaffRole(role);

    if (isBorrowerOnly && !userIsBorrower) {
      return forbiddenResponse(request, "/dashboard");
    }

    if (isStaffOnly && !userIsStaff) {
      return forbiddenResponse(request, "/my-loans");
    }

    if (
      isPublic &&
      !isApiRoute(pathName) &&
      !pathName.startsWith("/auth/callback") &&
      !pathName.startsWith("/reset-password") &&
      pathName !== "/"
    ) {
      return NextResponse.redirect(
        new URL(userIsBorrower ? "/my-loans" : "/dashboard", request.url),
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
