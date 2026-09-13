import { QueryClient } from '@tanstack/react-query'
import { ehErroDaApi } from '@/lib/http/erros'
import { sessao } from '@/lib/http/sessao'

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

let donoDoCache: string | null = null

/**
 * O cache pertence a um usuário numa formatura. Quando a sessão passa a ser de outro par, ele
 * é descartado antes de qualquer tela ler dele.
 *
 * As chaves não levam usuário nem formatura (`['formandos', 'eu']` é o CPF de quem estiver
 * logado). Os hooks de troca já limpam, mas a sessão também muda sem eles: queda por refresh
 * recusado seguida de outro login na mesma aba, ou outra aba que trocou de conta e rotacionou o
 * cookie. Sessão encerrada não limpa aqui — a tela de login não lê cache, e quem voltar a ser o
 * mesmo dono reaproveita o que tinha.
 */
sessao.inscrever(() => {
  const usuario = sessao.estado().usuario
  if (!usuario) return

  const dono = `${usuario.id}|${usuario.formaturaId ?? ''}`
  if (donoDoCache !== null && dono !== donoDoCache) queryClient.clear()
  donoDoCache = dono
})
