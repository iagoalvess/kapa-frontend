import { useParams } from 'react-router'
import mascoteErro from '@/assets/mascote/erro.webp'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Selo } from '@/components/Selo'
import { formatarCentavos, formatarData, formatarNumero, instanteDe } from '@/lib/formato'
import { ehErroDaApi } from '@/lib/http/erros'
import { ContagemRegressiva, useAgoraDoServidor } from '../components/ContagemRegressiva'
import { FormularioDeCompra } from '../components/FormularioDeCompra'
import { CabecalhoDaFesta, MolduraDaLoja, QuemVende } from '../components/MolduraDaLoja'
import { ReenvioDoLink } from '../components/ReenvioDoLink'
import { useLoja } from '../hooks/useLoja'
import type { ItemDaLoja } from '../types/loja.types'

/**
 * `/loja/:formaturaId` — a loja pública da turma (Sprint 26): qualquer pessoa com o link compra o
 * convite da festa, sem conta (P1).
 *
 * Sem sala de espera (decisão 6): o contador de restantes relê a cada poucos segundos, a abertura é
 * contada pelo relógio do servidor, e esgotado diz "esgotado" na hora.
 */
export default function LojaPage() {
  const { formaturaId = '' } = useParams()
  const loja = useLoja(formaturaId)

  if (loja.isPending)
    return (
      <MolduraDaLoja>
        <EsqueletoDeTexto linhas={8} />
      </MolduraDaLoja>
    )

  if (loja.isError) {
    const naoExiste = ehErroDaApi(loja.error) && loja.error.status === 404

    return (
      <MolduraDaLoja>
        {naoExiste ? (
          <div className="grid justify-items-center gap-3 text-center">
            <img src={mascoteErro} alt="" className="size-28" />
            <h1 className="text-xl font-semibold">Loja não encontrada</h1>
            <p className="text-muted-foreground text-sm">
              Esta turma não está vendendo convites por aqui. Confira o link com a comissão.
            </p>
          </div>
        ) : (
          <ErroDaConsulta erro={loja.error} aoTentarDeNovo={() => void loja.refetch()} />
        )}
      </MolduraDaLoja>
    )
  }

  return <Vitrine formaturaId={formaturaId} loja={loja.data} aoEsgotar={() => void loja.refetch()} />
}

function Vitrine({
  formaturaId,
  loja,
  aoEsgotar,
}: {
  formaturaId: string
  loja: NonNullable<ReturnType<typeof useLoja>['data']>
  aoEsgotar: () => void
}) {
  const agora = useAgoraDoServidor(loja.diferencaDoRelogio)

  // O servidor diz se já abriu; entre uma leitura e outra, o relógio corrigido libera o botão na hora
  // certa — e a API recusa quem chegar antes, qualquer que seja o relógio dele.
  const aberto = (item: ItemDaLoja) =>
    item.aberto || (item.abertura_de_vendas !== null && instanteDe(item.abertura_de_vendas) <= agora)
  const compraveis = loja.itens.filter((item) => aberto(item) && item.disponivel !== 0)
  const unico = loja.itens.length === 1 ? loja.itens[0] : undefined

  return (
    <MolduraDaLoja>
      {unico ? (
        // Um convite só: ele é o título, e o cartão some — preço e situação ficam no topo.
        <CabecalhoDaFesta
          turma={`${loja.turma} · ${loja.instituicao}`}
          festa={loja.festa}
          titulo={unico.descricao}
        >
          <div className="mt-1 grid justify-items-center gap-1">
            <p className="flex items-center gap-2">
              <span className="text-xl font-semibold tabular-nums">
                {formatarCentavos(unico.preco_em_centavos)}
              </span>
              <SituacaoDoItem item={unico} aberto={aberto(unico)} />
            </p>
            <PrazosDoItem item={unico} aberto={aberto(unico)} agora={agora} />
          </div>
        </CabecalhoDaFesta>
      ) : (
        <>
          <CabecalhoDaFesta turma={`${loja.turma} · ${loja.instituicao}`} festa={loja.festa} />

          <ul className="grid gap-3" aria-label="Convites à venda">
            {loja.itens.map((item) => (
              <li key={item.id} className="grid gap-2 rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid">
                    <span className="font-medium">{item.descricao}</span>
                    <span className="text-lg font-semibold tabular-nums">
                      {formatarCentavos(item.preco_em_centavos)}
                    </span>
                  </div>
                  <SituacaoDoItem item={item} aberto={aberto(item)} />
                </div>
                <PrazosDoItem item={item} aberto={aberto(item)} agora={agora} />
              </li>
            ))}
          </ul>
        </>
      )}

      {compraveis.length > 0 ? (
        <section aria-labelledby="titulo-da-compra" className="grid gap-4">
          <h2 id="titulo-da-compra" className="text-lg font-semibold">
            Comprar
          </h2>
          <FormularioDeCompra
            formaturaId={formaturaId}
            itens={compraveis}
            meios={loja.meios}
            aoEsgotar={aoEsgotar}
          />
        </section>
      ) : null}

      <QuemVende turma={loja.turma} contato={loja.contato_da_comissao} />
      <ReenvioDoLink formaturaId={formaturaId} />
    </MolduraDaLoja>
  )
}

/** Quando as vendas abrem (em contagem regressiva) e até quando vão. */
function PrazosDoItem({ item, aberto, agora }: { item: ItemDaLoja; aberto: boolean; agora: number }) {
  return (
    <>
      {!aberto && item.abertura_de_vendas && instanteDe(item.abertura_de_vendas) > agora ? (
        <p className="text-sm">
          <ContagemRegressiva ate={item.abertura_de_vendas} agora={agora} prefixo="As vendas abrem em" />
        </p>
      ) : null}
      {item.vendas_ate ? (
        <p className="text-muted-foreground text-xs">Vendas até {formatarData(item.vendas_ate)}.</p>
      ) : null}
    </>
  )
}

/** Esgotado, quantos restam, ou que ainda não abriu — o número é **reservado**, não pago. */
function SituacaoDoItem({ item, aberto }: { item: ItemDaLoja; aberto: boolean }) {
  if (item.disponivel === 0) return <Selo tom="perigo">Esgotado</Selo>
  if (!aberto) return <Selo tom="alerta">Em breve</Selo>
  if (item.disponivel === null) return <Selo tom="sucesso">À venda</Selo>

  return <Selo tom="sucesso">Restam {formatarNumero(item.disponivel)}</Selo>
}
