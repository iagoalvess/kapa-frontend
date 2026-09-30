import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/http/cliente'

/** O total juntado ao fim de um mês. Espelha `MesDaArrecadacaoDTO`. */
interface MesDaArrecadacao {
  /** Primeiro dia do mês, `aaaa-mm-dd`. */
  mes: string
  /** Tudo o que entrou até o fim do mês, acumulado. */
  arrecadado_em_centavos: number
  /** Mês no futuro: o que já entrou mais o que vence nele. */
  projetado: boolean
}

/**
 * Quanto a turma tinha juntado ao fim de cada um dos últimos cinco meses, e o previsto para o próximo
 * — o gráfico do Início.
 *
 * Mora em `hooks/` porque quem a desenha é o Início, que não é feature. A chave fica sob
 * `financeiro`: pagar ou estornar invalida esse prefixo, e o gráfico acompanha sem ninguém lembrar.
 */
export function useArrecadacao() {
  return useQuery({
    queryKey: ['financeiro', 'caixa', 'arrecadacao'],
    queryFn: ({ signal }) => api.get<MesDaArrecadacao[]>('/api/v1/financeiro/caixa/arrecadacao', { signal }),
  })
}
