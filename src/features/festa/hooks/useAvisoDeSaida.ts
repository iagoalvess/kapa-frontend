import { useEffect } from 'react'
import { useBlocker } from 'react-router'

/**
 * Segura a saída da tela com o mapa por salvar: a navegação do app pergunta antes, e fechar ou
 * recarregar a aba cai no aviso do próprio navegador.
 *
 * @param sujo Se há mudança por salvar; sem ela, nada é segurado.
 * @returns O bloqueio do roteador, para o diálogo de "sair sem salvar".
 */
export function useAvisoDeSaida(sujo: boolean) {
  const bloqueio = useBlocker(
    ({ currentLocation, nextLocation }) => sujo && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!sujo) return
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [sujo])

  return bloqueio
}
