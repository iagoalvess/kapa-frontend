import { createContext } from 'react'
import { useLocation, useMatches } from 'react-router'

export const ContextoDeVoltaDaPagina = createContext(false)

interface OrigemDaNavegacao {
  caminho: string
  titulo: string
  estado: unknown
}

/** O título declarado na rota também nomeia o caminho de volta dos atalhos. */
export function useTituloDaRota() {
  return useMatches()
    .map((rota) => rota.handle)
    .findLast(
      (handle): handle is { titulo: string } =>
        typeof handle === 'object' &&
        handle !== null &&
        'titulo' in handle &&
        typeof handle.titulo === 'string',
    )?.titulo
}

/** Guarda a URL completa e o estado da origem para restaurar também seus filtros e sua saída. */
export function useEstadoComOrigem() {
  const local = useLocation()
  const titulo = useTituloDaRota()

  return titulo
    ? {
        origemDaPagina: {
          caminho: local.pathname + local.search + local.hash,
          titulo,
          estado: local.state as unknown,
        } satisfies OrigemDaNavegacao,
      }
    : undefined
}

/** Acesso direto não tem origem; estados incompletos ou endereços externos não viram saída. */
export function useOrigemDaNavegacao(): OrigemDaNavegacao | undefined {
  const { state, pathname, search, hash } = useLocation()
  if (typeof state !== 'object' || state === null || !('origemDaPagina' in state)) return undefined

  const origem: unknown = state.origemDaPagina
  if (
    typeof origem !== 'object' ||
    origem === null ||
    !('caminho' in origem) ||
    typeof origem.caminho !== 'string' ||
    !origem.caminho.startsWith('/') ||
    origem.caminho.startsWith('//') ||
    origem.caminho.includes('\\') ||
    origem.caminho === pathname + search + hash ||
    !('titulo' in origem) ||
    typeof origem.titulo !== 'string' ||
    !origem.titulo.trim()
  ) {
    return undefined
  }

  return {
    caminho: origem.caminho,
    titulo: origem.titulo,
    estado: 'estado' in origem ? origem.estado : undefined,
  }
}
