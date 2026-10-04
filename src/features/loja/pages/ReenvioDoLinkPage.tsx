import { useNavigate, useParams } from 'react-router'
import { rotaDaLoja } from '@/config/rotas'
import { FormularioDeReenvio } from '../components/FormularioDeReenvio'
import { CabecalhoDaFesta, MolduraDaLoja } from '../components/MolduraDaLoja'
import { useLoja } from '../hooks/useLoja'

/**
 * `/loja/:formaturaId/reenviar` — "Já comprei e não acho meus convites" (Sprint 26, decisão 10): o
 * comprador informa o e-mail e o Kapa manda um link novo, sem conta e sem dizer se aquele e-mail comprou.
 *
 * A casca é a da loja (`MolduraDaLoja`): quem chega aqui veio da loja, e um formulário solto no branco
 * pareceria outra coisa. O cabeçalho da festa só entra quando a vitrine responde — daqui se pede o link,
 * não se compra, então a tela não trava esperando a loja.
 */
export default function ReenvioDoLinkPage() {
  const { formaturaId = '' } = useParams()
  const navegar = useNavigate()
  const loja = useLoja(formaturaId)

  return (
    <MolduraDaLoja>
      {loja.data ? (
        <CabecalhoDaFesta turma={`${loja.data.turma} · ${loja.data.instituicao}`} festa={loja.data.festa} />
      ) : null}

      <section aria-labelledby="titulo-do-reenvio" className="grid gap-4">
        <div className="grid gap-1">
          <h2 id="titulo-do-reenvio" className="text-lg font-semibold">
            Já comprei e não acho meus convites
          </h2>
          <p className="text-muted-foreground text-sm">
            Informe o e-mail que você usou na compra e mandamos um link novo, que abre os seus convites. O
            link antigo deixa de valer.
          </p>
        </div>

        <FormularioDeReenvio
          formaturaId={formaturaId}
          aoVoltar={() => void navegar(rotaDaLoja(formaturaId))}
        />
      </section>
    </MolduraDaLoja>
  )
}
