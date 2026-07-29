import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export interface QueryProviderProps {
  /** Клиент запросов. Приходит пропсом, а не импортом: тесты подставляют свой. */
  client: QueryClient;
  /** Дерево приложения. */
  children: React.ReactNode;
}

/** TanStack Query + devtools (только в dev — в прод-бандл они не попадают). */
export const QueryProvider = ({ client, children }: QueryProviderProps) => (
  <QueryClientProvider client={client}>
    {children}
    {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
  </QueryClientProvider>
);
