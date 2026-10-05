import { CircleSlash, Plus, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AcaoComConfirmacao, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { AtalhosDaPagina } from '@/components/AtalhosDaPagina'
import { Avatar } from '@/components/Avatar'
import { EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ListaVazia } from '@/components/ListaVazia'
import { Paginacao } from '@/components/Paginacao'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { useTamanhoDaPagina } from '@/hooks/useTelaGrande'
import { contemBusca } from '@/lib/busca'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { paginar } from '@/lib/paginar'
import { DialogoDeLancamento } from '../components/DialogoDeLancamento'
import { useLancamentos } from '../hooks/useLancamentos'
import { useEncerrarItem } from '../hooks/usePlano'
import type { Lancamento } from '../types/cobrancas.types'

/**
 * Os lançamentos avulsos da turma (Sprint 48, D23): o que a tesouraria cobrou ou creditou a um formando só — o espelho
 * individual do rateio. Cada um é parcela como qualquer outra, no extrato, no PIX e no caixa.
 *
 * A lista vem inteira da API (são poucos por turma) e se pagina aqui, com a busca pelo nome ou pela descrição. Desfazer
 * é encerrar: as parcelas que ainda não venceram caem, e o que já foi pago fica.
 */
export default function LancamentosPage() {
  const tamanhoDaPagina = useTamanhoDaPagina()
  const { pagina: paginaPedida, busca, atualizar } = useFiltrosDaUrl()
  const lancamentos = useLancamentos()
  const editavel = useEscritaLiberada()
  const [aberto, definirAberto] = useState(0)

  const todos = lancamentos.data ?? []
  const filtrados = todos.filter((lancamento) =>
    contemBusca(busca, lancamento.nome, lancamento.descricao ?? ''),
  )
  const pagina = paginar(filtrados, paginaPedida, tamanhoDaPagina)

  return (
    <>
      <AtalhosDaPagina atalhos={[{ titulo: 'Parcelas', para: ROTAS.parcelas, icone: ReceiptText }]} />

      <FiltrosDaPlanilha
        principal={null}
        busca={{
          valor: busca,
          rotulo: 'Buscar lançamento',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        contagem={{ mostrando: pagina.visiveis.length, total: filtrados.length, unidade: 'lançamentos' }}
        acaoPrincipal={
          <Button size="xs" disabled={!editavel} onClick={() => definirAberto((vez) => vez + 1)}>
            <Plus aria-hidden />
            Novo lançamento
          </Button>
        }
      />

      <section
        aria-label="Lançamentos avulsos"
        className="bg-card shadow-cartao rounded-3xl px-5 py-2 max-lg:-mx-4 max-lg:rounded-none max-lg:border-y max-lg:px-4 max-lg:py-0 max-lg:shadow-none"
      >
        {lancamentos.isPending ? <EsqueletoDeTabela colunas={4} /> : null}
        {lancamentos.isError ? (
          <ErroDaConsulta
            compacto
            erro={lancamentos.error}
            aoTentarDeNovo={() => void lancamentos.refetch()}
          />
        ) : null}
        {lancamentos.data && filtrados.length === 0 ? (
          <ListaVazia
            titulo={busca ? 'Nenhum lançamento com essa busca' : 'Nenhum lançamento ainda'}
            dica={
              busca
                ? 'Tente outro nome ou outra descrição.'
                : 'Use para o que é de um formando só: a multa da mesa quebrada, a segunda via, a bolsa da comissão.'
            }
          />
        ) : null}
        {pagina.visiveis.length > 0 ? (
          <>
            <Tabela
              emLista
              legenda="Lançamentos avulsos"
              cabecalho={
                <>
                  <th className="py-3 pr-4 font-normal">Formando</th>
                  <th className="py-3 pr-4 font-normal">Lançamento</th>
                  <th className="py-3 pr-4 text-right font-normal">Valor</th>
                  <th className="py-3 pr-4 font-normal">Primeiro vencimento</th>
                  <th className="py-3 pr-4 font-normal">Situação</th>
                </>
              }
            >
              {pagina.visiveis.map((lancamento) => (
                <LinhaDoLancamento
                  key={lancamento.item_de_cobranca_id}
                  lancamento={lancamento}
                  editavel={editavel}
                />
              ))}
            </Tabela>
            <Paginacao
              pagina={pagina.pagina}
              totalPaginas={pagina.totalPaginas}
              total={pagina.total}
              aoMudar={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
            />
          </>
        ) : null}
      </section>

      {aberto > 0 ? <DialogoDeLancamento key={aberto} aberto aoFechar={() => definirAberto(0)} /> : null}
    </>
  )
}

function LinhaDoLancamento({ lancamento, editavel }: { lancamento: Lancamento; editavel: boolean }) {
  const encerrar = useEncerrarItem()
  const credito = lancamento.valor_em_centavos < 0

  return (
    <tr className="border-b last:border-0">
      <th scope="row" className="py-3 pr-4 text-left font-normal">
        <div className="flex items-center gap-3">
          <Avatar nome={lancamento.nome} semente={lancamento.usuario_id} className="size-8 text-sm" />
          <span className="text-foreground truncate font-medium">{lancamento.nome}</span>
        </div>
      </th>
      <td className="py-3 pr-4">
        {lancamento.descricao ?? '—'}
        <span className="text-muted-foreground block text-xs">
          lançado em {formatarData(lancamento.lancado_em)}
        </span>
      </td>
      <td className="py-3 pr-4 text-right whitespace-nowrap tabular-nums">
        {credito
          ? `− ${formatarCentavos(-lancamento.valor_em_centavos)}`
          : formatarCentavos(lancamento.valor_em_centavos)}
        {lancamento.numero_de_parcelas > 1 ? (
          <span className="text-muted-foreground text-xs">
            {' '}
            em {formatarNumero(lancamento.numero_de_parcelas)}×
          </span>
        ) : null}
      </td>
      <td className="py-3 pr-4 whitespace-nowrap">{formatarData(lancamento.primeiro_vencimento)}</td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1">
          <Selo tom={credito ? 'marca' : 'cinza'}>{credito ? 'Crédito' : 'Cobrança'}</Selo>
          {lancamento.encerrado_em ? <Selo>Encerrado</Selo> : null}
        </div>
      </td>
      <td className="py-3 text-right">
        {editavel && !lancamento.encerrado_em ? (
          <AcoesDaLinha rotulo={`Ações do lançamento de ${lancamento.nome}`}>
            <AcaoComConfirmacao
              rotulo="Encerrar"
              descricaoAcessivel={`Encerrar ${lancamento.descricao ?? 'o lançamento'} de ${lancamento.nome}`}
              icone={CircleSlash}
              desabilitada={encerrar.isPending}
              confirmacao={{
                titulo: `Encerrar “${lancamento.descricao}”?`,
                descricao:
                  'As parcelas que ainda não venceram deixam de valer. O que já venceu continua devido, e o que já entrou fica.',
                rotulo: 'Encerrar',
                aoConfirmar: () =>
                  encerrar.mutate(
                    { planoId: lancamento.plano_id, itemId: lancamento.item_de_cobranca_id },
                    { onSuccess: () => toast.info('Lançamento encerrado.'), onError: avisarErro },
                  ),
              }}
            />
          </AcoesDaLinha>
        ) : null}
      </td>
    </tr>
  )
}
