import { QueryClient } from '@tanstack/react-query'
import { ehErroDaApi } from '@/lib/http/erros'

/**
 * Cache de estado de servidor da aplicação.
 *
 * É a única fonte de dado vindo da API — não existe cópia em estado global. Ver
 * `docs/decisoes.md`.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Um minuto sem refazer a chamada. Zero (o padrão do React Query) transforma cada
      // montagem de componente em uma requisição.
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (tentativa, erro) => {
        // 4xx é resposta, não instabilidade: repetir devolve o mesmo 404 três vezes mais devagar.
        if (ehErroDaApi(erro) && erro.status < 500) return false
        return tentativa < 2
      },
    },
    mutations: {
      // Mutação não é idempotente. Repetir um POST sozinho cria o registro duas vezes.
      retry: false,
    },
  },
})
