import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";


import appCss from "../styles.css?url";
import { MyToastRegion } from "@/components/ui/Toast";
import { getStoredUser, type ApiUser } from "@/lib/api";

const darkThemeOverrideCss = `
html.dark body{background:#000000!important;color:#ffffff!important}
html.dark .es-app-shell{background:#000000!important;color:#ffffff!important}
html.dark .es-app-sidebar,html.dark .es-sidebar-brand,html.dark .es-app-header{background:#000000!important;border-color:#222326!important;color:#ffffff!important}
html.dark .es-app-sidebar-separator,html.dark .es-app-header-separator{background:#222326!important}
html.dark .es-app-sidebar a:not([aria-current="page"]),html.dark .es-app-sidebar button:not([aria-current="page"]){color:#888991!important}
html.dark .es-app-sidebar a[aria-current="page"],html.dark .es-app-sidebar [data-active="true"]{background:#131416!important;color:#ffffff!important}
html.dark .es-app-sidebar a:hover,html.dark .es-app-sidebar button:hover{background:#121213!important;color:#ffffff!important}
html.dark [class~="bg-white"],html.dark [class~="bg-[#ffffff]"]{background-color:#000000!important}
html.dark [class~="bg-[#f7f8fb]"],html.dark [class~="bg-[#f7f6fb]"],html.dark [class~="bg-zinc-50"]{background-color:#131416!important}
html.dark [class~="bg-[#f9fbfc]"],html.dark [class~="bg-[#f7fbff]"],html.dark [class~="bg-[#f4f6fa]"],html.dark [class~="bg-[#f4f5f7]"],html.dark [class~="bg-[#f3f5f8]"]{background-color:#131416!important}
html.dark [class~="bg-[#fcfdfd]"],html.dark [class~="bg-[#fcfdfe]"],html.dark [class~="bg-[#fbfcfd]"],html.dark [class~="bg-[#fafbfc]"],html.dark [class~="bg-[#f8fafc]"],html.dark [class~="bg-[#f3f4f6]"]{background-color:#000000!important}
html.dark [class~="bg-[#f0f1f3]"],html.dark [class~="bg-[#edf2f8]"],html.dark [class~="bg-zinc-100"]{background-color:#131416!important}
html.dark [class~="bg-[#eef0f4]"],html.dark [class~="bg-[#e8eef7]"],html.dark [class~="bg-[#e2e5ec]"],html.dark [class~="bg-zinc-200"]{background-color:#1a1b1e!important}
html.dark [class~="bg-[#eef0f5]"],html.dark [class~="bg-[#edf0f4]"],html.dark [class~="bg-[#e5e7ef]"],html.dark [class~="bg-[#e7e9f0]"],html.dark [class~="bg-[#e8eaee]"]{background-color:#222326!important}
html.dark [class~="border-[#eef0f4]"],html.dark [class~="border-[#eef0f5]"],html.dark [class~="border-[#eef0f2]"],html.dark [class~="border-[#f0f1f3]"],html.dark [class~="border-[#edf0f4]"]{border-color:#222326!important}
html.dark [class~="border-[#e2e5ec]"],html.dark [class~="border-[#e2e6ed]"],html.dark [class~="border-[#e2e8f0]"],html.dark [class~="border-[#e5e7ef]"],html.dark [class~="border-[#e5e8ef]"],html.dark [class~="border-[#e7e9f0]"],html.dark [class~="border-[#d8dde6]"],html.dark [class~="border-[#dfe3eb]"],html.dark [class~="border-zinc-100"],html.dark [class~="border-zinc-200"]{border-color:#222326!important}
html.dark [class~="border-[#d1d5db]"],html.dark [class~="border-[#c8cdd5]"],html.dark [class~="border-zinc-300"]{border-color:#2f3036!important}
html.dark [class~="divide-[#f0f1f3]"]>:not([hidden])~:not([hidden]),html.dark [class~="divide-[#eef0f4]"]>:not([hidden])~:not([hidden]),html.dark [class~="divide-zinc-200"]>:not([hidden])~:not([hidden]),html.dark table thead tr,html.dark table tbody tr,html.dark table th,html.dark table td{border-color:#222326!important}
html.dark .es-dashboard-list>:not([hidden])~:not([hidden]){border-top-color:#222326!important;border-top-width:1px!important}
html.dark [class~="hover:bg-[#f7f8fb]"]:hover,html.dark [class~="hover:bg-[#f7f6fb]"]:hover{background-color:#121213!important}
html.dark [class~="hover:bg-[#f9fbfc]"]:hover,html.dark [class~="hover:bg-[#fcfdfd]"]:hover,html.dark [class~="hover:bg-[#fcfdfe]"]:hover,html.dark [class~="hover:bg-[#fafbfc]"]:hover,html.dark [class~="hover:bg-[#f8fafc]"]:hover{background-color:#121213!important}
html.dark [class~="hover:bg-[#f0f1f3]"]:hover,html.dark [class~="hover:bg-[#eef0f4]"]:hover,html.dark [class~="hover:bg-zinc-100"]:hover,html.dark [class~="data-[state=open]:bg-[#f0f1f3]"][data-state="open"],html.dark [class~="data-[highlighted]:bg-[#f7f8fb]"][data-highlighted],html.dark [class~="data-[selected=true]:bg-[#f0f1f3]"][data-selected="true"]{background-color:#121213!important}
html.dark [class~="hover:bg-[#e2e5ec]"]:hover,html.dark [class~="hover:bg-[#e8eaee]"]:hover,html.dark [class~="hover:bg-zinc-200"]:hover,html.dark [class~="active:bg-[#f3f4f6]"]:active{background-color:#121213!important}
html.dark [class~="text-[#000000]"],html.dark [class~="text-[#111111]"],html.dark [class~="text-black"],html.dark [class~="text-zinc-950"],html.dark [class~="text-zinc-900"],html.dark [class~="text-zinc-800"]{color:#ffffff!important}
html.dark [class~="text-[#2b2f3a]"],html.dark [class~="text-[#303646]"],html.dark [class~="text-[#333]"]{color:#ffffff!important}
html.dark [class~="text-[#4d5568]"],html.dark [class~="text-[#4b5563]"],html.dark [class~="text-[#5c6475]"],html.dark [class~="text-zinc-700"]{color:#888991!important}
html.dark [class~="text-[#666666]"],html.dark [class~="text-[#697085]"],html.dark [class~="text-[#777777]"],html.dark [class~="text-zinc-600"]{color:#888991!important}
html.dark [class~="text-[#888888]"],html.dark [class~="text-[#8a90a0]"],html.dark [class~="text-[#8a93a3]"],html.dark [class~="text-[#9299aa]"],html.dark [class~="text-zinc-500"]{color:#888991!important}
html.dark [class~="text-[#9aa1b0]"],html.dark [class~="text-[#b0b7c4]"],html.dark [class~="hover:text-[#444444]"]:hover{color:#888991!important}
html.dark [class~="hover:text-[#000000]"]:hover,html.dark [class~="hover:text-[#000]"]:hover,html.dark [class~="hover:text-black"]:hover{color:#ffffff!important}
html.dark [class~="bg-[#000000]"],html.dark [class~="bg-black"],html.dark [class~="!bg-[#000000]"]{border-color:#ffffff!important;background-color:#ffffff!important;color:#000000!important}
html.dark [class~="bg-[#000000]"][class~="text-white"],html.dark [class~="bg-black"][class~="text-white"],html.dark [class~="!bg-[#000000]"][class~="text-white"],html.dark [class~="!bg-[#000000]"][class~="!text-white"],html.dark [class~="bg-[#000000]"] [class~="text-white"],html.dark [class~="bg-black"] [class~="text-white"],html.dark [class~="!bg-[#000000]"] [class~="text-white"],html.dark [class~="!bg-[#000000]"] [class~="!text-white"]{color:#000000!important}
html.dark [class~="bg-[#000000]"] [class~="text-white/60"],html.dark [class~="bg-black"] [class~="text-white/60"]{color:rgba(0,0,0,.55)!important}
html.dark [class~="bg-[#000000]"] [class~="text-white/70"],html.dark [class~="bg-black"] [class~="text-white/70"]{color:rgba(0,0,0,.7)!important}
html.dark [class~="bg-[#000000]"] [class~="bg-white/10"],html.dark [class~="bg-black"] [class~="bg-white/10"]{background-color:rgba(0,0,0,.08)!important}
html.dark [class~="hover:bg-[#333]"]:hover,html.dark [class~="hover:bg-[#333333]"]:hover,html.dark [class~="hover:!bg-[#333333]"]:hover,html.dark [class~="hover:bg-zinc-950"]:hover,html.dark [class~="hover:bg-zinc-900"]:hover{background-color:#ffffff!important;color:#000000!important}
html.dark [class~="hover:bg-[#333]"]:hover [class~="text-[#ffffff]"],html.dark [class~="hover:bg-[#333333]"]:hover [class~="text-white"],html.dark [class~="hover:!bg-[#333333]"]:hover [class~="text-white"],html.dark [class~="hover:!bg-[#333333]"]:hover [class~="!text-white"]{color:#000000!important}
html.dark [class~="hover:bg-[#fff5f5]"]:hover,html.dark [class~="data-[highlighted]:bg-[#fff5f5]"][data-highlighted],html.dark [class~="hover:bg-rose-50"]:hover,html.dark [class~="bg-rose-50"]{background-color:#2a1616!important}
html.dark [class~="bg-[#e6fbf4]"],html.dark [class~="bg-[#e2f5ec]"],html.dark [class~="hover:bg-[#e6fbf4]"]:hover{background-color:#162018!important}
html.dark [class~="bg-[#fef3c7]"],html.dark [class~="bg-[#fefce8]"],html.dark [class~="bg-[#fefce8]/40"]{background-color:#242014!important}
html.dark [class~="bg-[#eff6ff]"],html.dark [class~="bg-[#eff6ff]/40"],html.dark [class~="bg-[#eff6ff]/35"],html.dark [class~="hover:bg-[#dbeafe]"]:hover{background-color:#131416!important}
html.dark [class~="text-[#059669]"],html.dark [class~="text-[#10b981]"]{color:#4ade80!important}
html.dark [class~="text-[#d97706]"],html.dark [class~="text-[#854d0e]"]{color:#fbbf24!important}
html.dark [class~="text-[#1e40af]"]{color:#a3a3a3!important}
html.dark [class~="border-[#fecaca]"]{border-color:#5c2a2a!important}
html.dark [class~="border-[#fef08a]"]{border-color:#4a4420!important}
html.dark [class~="border-[#bfdbfe]"],html.dark [class~="border-[#2563eb]/20"]{border-color:#333!important}
html.dark [class~="border-[#10b981]/20"]{border-color:#2a3d30!important}
html.dark [class~="focus:border-[#000000]"]:focus,html.dark [class~="focus:border-[#000]"]:focus{border-color:#ccc!important}
html.dark [class~="disabled:bg-[#f7f8fb]"]:disabled{background-color:#121212!important}
html.dark input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([cmdk-input]):not([data-no-style]),html.dark select,html.dark textarea{border-color:#333!important;background-color:#1c1c1c!important;color:#f5f5f5!important}
html.dark input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([cmdk-input]):not([data-no-style]):focus,html.dark select:focus,html.dark textarea:focus{border-color:#ccc!important}
html.dark .rg-dropdown-menu{border-color:#333!important;background:#1c1c1c!important;box-shadow:0 18px 60px rgba(0,0,0,.5)!important}
html.dark .rg-dropdown-item{color:#d4d4d4!important}
html.dark .rg-dropdown-item:hover,html.dark .rg-dropdown-item[data-highlighted="true"]{background:#2a2a2a!important;color:#f5f5f5!important}
`;

const themeBootScript = `(function(){try{var p=location.pathname;if(p==="/login"||p==="/signup"||p==="/introduction"){document.documentElement.classList.remove("dark");document.documentElement.dataset.appearanceMode="light";document.documentElement.dataset.esTheme="light";document.documentElement.style.colorScheme="light";return}var mode="light";try{var raw=localStorage.getItem("grandwiki_user_preferences");if(raw){var u=JSON.parse(raw);if(u&&u.appearanceMode)mode=u.appearanceMode}}catch(e){}var dark=mode==="dark"||(mode!=="light"&&mode==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark)document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");document.documentElement.dataset.appearanceMode=mode;document.documentElement.dataset.esTheme=dark?"dark":"light";document.documentElement.style.colorScheme=dark?"dark":"light"}catch(e){}})();`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <h1 className="text-8xl font-bold text-[#000000] tracking-tight">404</h1>
        <h2 className="mt-4 text-[22px] font-semibold text-[#000000]">Page not found</h2>
        <p className="mt-2 text-[15px] text-[#9aa1b0]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex h-[40px] items-center justify-center rounded-[8px] bg-[#000000] px-6 text-[14px] font-medium text-white transition-all hover:bg-[#333]"
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <h1 className="text-[24px] font-bold tracking-tight text-[#000000]">
          This page didn't load
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#9aa1b0]">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-[42px] items-center justify-center rounded-[8px] bg-[#000000] px-6 text-[14px] font-medium text-white transition-all hover:bg-[#333]"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-[42px] items-center justify-center rounded-[8px] border-2 border-[#eef0f4] bg-white px-6 text-[14px] font-medium text-[#4b5563] transition-all hover:bg-[#f7f8fb]"
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
      { title: "Grand Wiki" },
      { name: "description", content: "Grand Wiki - Comprehensive Grand RP Guides, Tools & Database" },
      { property: "og:title", content: "Grand Wiki" },
      { property: "og:description", content: "Grand Wiki - Comprehensive Grand RP Guides, Tools & Database" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/Brand/Favicon.png" },
      { rel: "shortcut icon", href: "/Brand/Favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <style id="esportific-dark-theme-root">{darkThemeOverrideCss}</style>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Authentication guard disabled - open access to all
function OnboardingGuard({ pathname }: { pathname: string }) {
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <OnboardingGuard pathname={location.pathname} />
      <ThemeClassManager pathname={location.pathname} />
      <Outlet />
      <MyToastRegion />
    </QueryClientProvider>
  );
}

function resolveDarkMode(mode: ApiUser["appearanceMode"]): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function ThemeClassManager({ pathname }: { pathname: string }) {
  useEffect(() => {
    const styleId = "esportific-dark-theme-root";
    const style =
      document.getElementById(styleId) ||
      Object.assign(document.createElement("style"), { id: styleId });
    style.textContent = darkThemeOverrideCss;
    document.head.appendChild(style);

    const authPages = new Set(["/login", "/signup"]);
    const root = document.documentElement;

    const applyTheme = (mode?: ApiUser["appearanceMode"]) => {
      if (authPages.has(pathname)) {
        root.classList.remove("dark");
        root.dataset.appearanceMode = "light";
        root.dataset.esTheme = "light";
        return;
      }

      // Read from new localStorage key for public users
      let nextMode: ApiUser["appearanceMode"] = "light";
      try {
        const userPrefs = localStorage.getItem("grandwiki_user_preferences");
        if (userPrefs) {
          const parsed = JSON.parse(userPrefs);
          nextMode = parsed.appearanceMode || "light";
        }
      } catch {
        nextMode = mode || "light";
      }
      
      const isDark = resolveDarkMode(nextMode);
      root.classList.toggle("dark", isDark);
      root.dataset.appearanceMode = nextMode;
      root.dataset.esTheme = isDark ? "dark" : "light";
    };

    applyTheme();

    const onUserUpdated = (event: Event) => {
      const user = (event as CustomEvent<ApiUser>).detail;
      applyTheme(user?.appearanceMode);
    };
    const onPreview = (event: Event) => {
      applyTheme((event as CustomEvent<ApiUser["appearanceMode"]>).detail);
    };
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChange = () => applyTheme();

    window.addEventListener("esports:user-updated", onUserUpdated);
    window.addEventListener("grandwiki:user-updated", onUserUpdated); // Listen to new event
    window.addEventListener("esports:appearance-preview", onPreview);
    media.addEventListener("change", onSystemThemeChange);

    return () => {
      window.removeEventListener("esports:user-updated", onUserUpdated);
      window.removeEventListener("grandwiki:user-updated", onUserUpdated);
      window.removeEventListener("esports:appearance-preview", onPreview);
      media.removeEventListener("change", onSystemThemeChange);
    };
  }, [pathname]);

  return null;
}
