import { orpc, queryClient } from './lib/orpc';
import { routeTree } from './routeTree.gen';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import nprogress from 'nprogress';
import ReactDOM from 'react-dom/client';

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: { orpc, queryClient },
  Wrap: function WrapComponent({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  },
});

nprogress.configure({ showSpinner: false });

router.subscribe('onBeforeLoad', ({ pathChanged }) => pathChanged && nprogress.start());
router.subscribe('onLoad', () => nprogress.done());

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Root element not found');
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
