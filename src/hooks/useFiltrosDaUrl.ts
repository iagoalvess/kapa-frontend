import { useSearchParams } from 'react-router'

/**
 * O filtro da tela lido e gravado na query string — página, busca e o que mais a lista filtrar.
 *
 * A URL é a dona do estado: voltar, recarregar e mandar o link devolvem a mesma lista. Gravar é
 * sempre por `atualizar`, que zera a página junto, porque filtro novo reordena a lista inteira e a
 * página 3 do filtro antigo não quer dizer nada no novo — paginar passa `pagina` explícito, que
 * vence.
 *
 * @returns `parametros` para ler os filtros próprios da tela, `pagina` e `busca` já saneados, e
 *   `atualizar`. `busca` vem vazia quando não há: passe `busca || undefined` para a consulta, para
 *   não sujar a chave de cache do React Query.
 */
export function useFiltrosDaUrl() {
  const [parametros, definirParametros] = useSearchParams()

  const atualizar = (mudancas: Record<string, string | null>) =>
    definirParametros((atuais) => {
      const proximos = new URLSearchParams(atuais)
      for (const [chave, valor] of Object.entries({ pagina: null, ...mudancas })) {
        if (valor === null || valor === '') proximos.delete(chave)
        else proximos.set(chave, valor)
      }
      return proximos
    })

  return {
    parametros,
    // Página fora da faixa (`0`, `-3`, `abc`, `2.5`) volta a ser a primeira: o número vem da barra
    // de endereço, que qualquer um edita.
    pagina: Math.max(1, Math.trunc(Number(parametros.get('pagina'))) || 1),
    busca: parametros.get('busca')?.trim() ?? '',
    atualizar,
  }
}
