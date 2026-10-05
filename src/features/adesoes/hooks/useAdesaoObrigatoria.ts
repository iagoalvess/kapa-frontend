import { PAPEIS } from '@/config/perfis'
import { useFormaturaAtiva, usePapel } from '@/hooks/useSessao'
import { useMinhaAdesao } from './useAderir'
import { useConteudoParaAdesao } from './useTermo'

/**
 * Se o formando precisa aderir antes de usar o app (Sprint 47, D18): é formando ativo, a turma publicou o termo e
 * ele ainda não aderiu. A mesma regra da política `MembroDaFormatura` na API, que é quem barra de verdade.
 *
 * A comissão não é barrada — ela monta a turma antes de qualquer adesão —, e o termo vigente só é consultado por quem
 * ainda não aderiu: para quem já assinou, a resposta está decidida sem ele.
 *
 * @returns `carregando` enquanto a resposta não está decidida; `pendente` quando a guarda deve levar ao termo.
 */
export function useAdesaoObrigatoria() {
  const { papel } = usePapel()
  const { desligadoEm } = useFormaturaAtiva()
  const formando = papel === PAPEIS.formando && !desligadoEm
  const minha = useMinhaAdesao(formando)
  const semAdesao = minha.data !== undefined && !minha.data.adesao
  const conteudo = useConteudoParaAdesao(formando && semAdesao)

  return {
    carregando: formando && (minha.isPending || (semAdesao && conteudo.isPending)),
    pendente: formando && semAdesao && Boolean(conteudo.data?.termo),
  }
}
