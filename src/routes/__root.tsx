import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Stores Voucher System | St. Mary's Guntur" },
      {
        name: "description",
        content:
          "Stores voucher and stock ledger system for St. Mary's Group of Institutions for Women, Guntur.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV: { to: "/" | "/receive" | "/issue" | "/ledger" | "/vouchers"; label: string }[] = [
  { to: "/", label: "Dashboard" },
  { to: "/receive", label: "Receive Material" },
  { to: "/issue", label: "Issue Material" },
  { to: "/ledger", label: "Stock Ledger" },
  { to: "/vouchers", label: "Vouchers" },
];

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}

function AppShell() {
  const nav = NAV;
  const collegeName = "St. Mary's Group of Institutions for Women";

  return (
    <>
      <div className="flex min-h-screen bg-background text-foreground">
        <aside className="hidden w-64 shrink-0 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
          <div className="px-2">
            <p className="font-serif text-lg font-bold leading-tight">St. Mary's</p>
            <p className="mt-1 text-xs opacity-70">
              Group of Institutions for Women, Guntur
            </p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-sidebar-primary">
              Stores Department
            </p>
          </div>
          <nav className="mt-8 flex flex-col gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{
                  className:
                    "rounded-md bg-sidebar-accent px-3 py-2 text-sm font-semibold text-sidebar-accent-foreground",
                }}
                inactiveProps={{
                  className:
                    "rounded-md px-3 py-2 text-sm opacity-75 transition-colors hover:bg-sidebar-accent/60",
                }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <p className="mt-auto px-2 text-[11px] opacity-60">
            Voucher management &amp; stock control
          </p>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex gap-1 overflow-x-auto border-b border-line bg-sidebar px-3 py-2 text-sidebar-foreground md:hidden">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{
                  className:
                    "whitespace-nowrap rounded-md bg-sidebar-accent px-3 py-1.5 text-xs font-semibold",
                }}
                inactiveProps={{
                  className: "whitespace-nowrap rounded-md px-3 py-1.5 text-xs opacity-75",
                }}
              >
                {n.label}
              </Link>
            ))}
          </div>
          <header className="flex items-center gap-3 border-b border-line px-4 py-3 md:px-8">
            <div>
              <p className="text-sm font-semibold">{collegeName}</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Stores portal
              </p>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
    </>
  );
}
