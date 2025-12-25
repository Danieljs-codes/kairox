import type { QueryClient } from "@tanstack/react-query";
import { AnchoredToastProvider, ToastProvider } from "@ui/toast";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import { orpc } from "@/utils/orpc";
import styles from "../styles/index.css?url";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "kairox",
      },
      {
        name: "description",
        content: "kairox is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
      {
        rel: "stylesheet",
        href: styles,
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <ToastProvider>
          <AnchoredToastProvider>
            <div className="grid grid-rows-[auto_1fr] h-svh">
              <Outlet />
            </div>
          </AnchoredToastProvider>
        </ToastProvider>
      </ThemeProvider>
      <TanStackDevtools
        config={{ openHotkey: ["CtrlOrMeta", "Shift", "d"] }}
        plugins={[
          {
            name: "TanStack Query",
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
          {
            name: "TanStack Form",
            render: <FormDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
}
