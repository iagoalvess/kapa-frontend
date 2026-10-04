import { Map as IconeDoMapa } from 'lucide-react'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { ROTAS } from '@/config/rotas'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { EditorDoSalao } from '../components/EditorDoSalao'
import { useMapaDeMesas } from '../hooks/useMesas'

/**
 * O editor do mapa do salão, em página própria.
 *
 * A lista de mesas ficou com o padrão do app (conteúdo principal + cards laterais) e o editor, que
 * precisa de largura para arrastar, saiu das abas "Mapa/Lista" para uma rota. O card lateral de
 * Mesas abre daqui, e a saída volta para a lista.
 */
export default function MapaDasMesasPage() {
  const mapa = useMapaDeMesas()
  const editavel = useEscritaLiberada()

  if (mapa.isPending)
    return (
      <>
        <LinkDeVolta para={ROTAS.mesas}>Mesas</LinkDeVolta>
        <EsqueletoDeCartao>
          <EsqueletoDeTexto linhas={6} />
        </EsqueletoDeCartao>
      </>
    )

  if (mapa.isError)
    return (
      <>
        <LinkDeVolta para={ROTAS.mesas}>Mesas</LinkDeVolta>
        <ErroDaConsulta erro={mapa.error} aoTentarDeNovo={() => void mapa.refetch()} />
      </>
    )

  return (
    <>
      <LinkDeVolta para={ROTAS.mesas}>Mesas</LinkDeVolta>

      <Cartao
        titulo="Mapa do salão"
        icone={IconeDoMapa}
        descricao="Arraste as mesas e monte o salão: palco, pista, entrada e o que mais houver. A turma vê onde fica a própria mesa."
      >
        <EditorDoSalao mapa={mapa.data} editavel={editavel} />
      </Cartao>
    </>
  )
}
