import { useQuery } from '@tanstack/react-query'
import { PAPEIS } from '@/config/perfis'
import { useFormaturaAtiva, usePapel } from '@/hooks/useSessao'
import { obterSituacaoDaAdesao } from '../api/adesoes.api'
import { chaves } from './chaves'

/**
 * Há termo e plano para aceitar, e a pessoa já aderiu? — três booleanos, e não a adesão e o termo inteiros.
 *
 * A guarda do formando e o ponto do menu perguntam isso em toda tela; antes cada um baixava `/adesoes/eu` e o termo
 * vigente (texto, plano simulado, catálogo) para tirar a mesma resposta. Os dois leem a mesma chave: uma consulta só.
 *
 * @param habilitado Falso não consulta — quem foi desligado não adere a nada, e a API responderia 403 (P5 da
 *   Sprint 15).
 */
export function useSituacaoDaAdesao(habilitado = true) {
  return useQuery({
    queryKey: chaves.minhaSituacao(),
    queryFn: ({ signal }) => obterSituacaoDaAdesao(signal),
    enabled: habilitado,
  })
}

/**
 * Se o formando precisa aderir antes de usar o app (Sprint 47, D18): é formando ativo, a turma publicou o termo e
 * ele ainda não aderiu. A mesma regra da política `MembroDaFormatura` na API, que é quem barra de verdade.
 *
 * A comissão não é barrada — ela monta a turma antes de qualquer adesão — e nem consulta.
 *
 * @returns `carregando` enquanto a resposta não está decidida; `pendente` quando a guarda deve levar ao termo.
 */
export function useAdesaoObrigatoria() {
  const { papel } = usePapel()
  const { desligadoEm } = useFormaturaAtiva()
  const formando = papel === PAPEIS.formando && !desligadoEm
  const situacao = useSituacaoDaAdesao(formando)

  return {
    carregando: formando && situacao.isPending,
    pendente: formando && situacao.data?.termo_publicado === true && !situacao.data.aderiu,
  }
}
