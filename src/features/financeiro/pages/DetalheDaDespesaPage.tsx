import { CalendarClock, CircleCheck, FileText, Handshake, Layers, Receipt, Tag, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import {
  EsqueletoDeCartao,
  EsqueletoDeCartoes,
  EsqueletoDeDados,
  EsqueletoDeTabela,
} from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Tabela } from '@/components/Planilha'
import { Button } from '@/components/ui/button'
import { ROTAS, rotaDaDespesa, rotaDoFornecedor } from '@/config/rotas'
import { PAPEIS } from '@/config/perfis'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { useItensDaFesta } from '@/hooks/useItensDaFesta'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos, formatarData, formatarMesCurto, formatarNumero } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import { DialogoDeDespesa } from '../components/DialogoDeDespesa'
import { DialogoDePagamento } from '../components/DialogoDePagamento'
import { SituacaoDaDespesa } from '../components/LinhaDeDespesa'
import { useAbrirComprovante, useCancelarDespesa, useDespesa, useDespesas } from '../hooks/useDespesas'
import { useFornecedores } from '../hooks/useFornecedores'
import { type Despesa, ROTULOS_DE_CATEGORIA, rotuloDaDespesa } from '../types/financeiro.types'

/** Teto de parcelas de um lançamento; uma página só, sem paginação à vista. */
const TAMANHO_DA_PAGINA = 100

const somar = (linhas: Despesa[]) => linhas.reduce((total, linha) => total + linha.valor_em_centavos, 0)

/**
 * Uma despesa lançada: o que é, de quem, quando vence, quanto e em que situação — e tudo o que se
 * faz com ela. É para cá que a lista manda ao clicar na despesa, como o cadastro do membro.
 *
 * Na parcelada, o lançamento inteiro aparece: a faixa com o compromisso e as irmãs em tabela — "2
 * de 3" sem elas não diz se a 1 foi paga nem quando vence a 3. Na despesa à vista os dois blocos
 * somem: repetiriam o cartão.
 *
 * Cancelar é só da prevista: a paga se corrige em "Editar" (decisão 5), porque cancelar uma despesa
 * já paga mudaria o saldo em silêncio. A cancelada não tem ação nenhuma — `Despesa.Aplicar` recusa
 * editá-la com `financeiro.despesa_cancelada`, e oferecer o botão só adiantaria um erro do servidor.
 * Quem cancelou errado relança.
 */
export default function DetalheDaDespesaPage() {
  const { id = '' } = useParams()
  const despesa = useDespesa(id)
  const [editando, definirEditando] = useState(false)
  const { tem } = usePapel()
  // Ler é de todo membro; lançar, pagar e cancelar continuam da Tesouraria — a API recusa o resto.
  const tesouraria = tem(PAPEIS.tesoureiro)
  const editavel = useEscritaLiberada() && tesouraria
  const cancelar = useCancelarDespesa()
  const comprovante = useAbrirComprovante()
  // A lista alimenta o `select` do diálogo de edição, e só ele: fechado, não se consulta. Cadastro
  // de fornecedor é da Tesouraria — para os demais a consulta nem sai, e voltaria 403.
  const fornecedores =
    useFornecedores({ ativo: true, tamanho: 100 }, tesouraria && editando).data?.itens ?? []
  const itensDaFesta = useItensDaFesta(editando).data?.filter((item) => !item.cancelado) ?? []

  const voltar = <LinkDeVolta para={ROTAS.despesas}>Despesas</LinkDeVolta>

  // O "voltar" fica: ele não depende da consulta, e some-lo faria a tela saltar quando ela voltar.
  if (despesa.isPending)
    return (
      <>
        {voltar}
        <EsqueletoDeCartoes quantidade={1} altura="h-32" className="md:grid-cols-1" />
        <EsqueletoDeCartao>
          <EsqueletoDeDados linhas={5} />
        </EsqueletoDeCartao>
      </>
    )

  if (despesa.isError)
    return (
      <>
        {voltar}
        <ErroDaConsulta erro={despesa.error} />
      </>
    )

  const dados = despesa.data

  /** A aba nasce antes da ida ao servidor: aberta depois dela, o navegador a trataria como pop-up. */
  const abrirComprovante = () => {
    const aba = window.open('', '_blank')
    comprovante.mutate(dados.id, {
      onSuccess: (arquivo) => {
        if (aba) aba.location.href = URL.createObjectURL(arquivo)
      },
      onError: (erro) => {
        aba?.close()
        toast.error(mensagemDoErro(erro))
      },
    })
  }

  const parcelada = dados.total_de_parcelas > 1

  return (
    <>
      {voltar}

      {parcelada ? <ResumoDoLancamento despesa={dados} /> : null}

      <Cartao
        titulo={rotuloDaDespesa(dados)}
        icone={Receipt}
        selo={<SituacaoDaDespesa despesa={dados} />}
        descricao={`${formatarCentavos(dados.valor_em_centavos)} · vence em ${formatarData(dados.vencimento)}`}
        acao={
          // Pílulas no cabeçalho, como as ações de linha das planilhas: pagar e cancelar são ações
          // da despesa, não um rodapé do cartão — esticadas na largura toda pesavam mais que o dado.
          // Na cancelada não sobra ação nenhuma: o selo já diz o que houve. Para quem não é da
          // Tesouraria também não: a tela é leitura, e botão cinza prometeria o que não vem.
          !tesouraria || dados.status === 'Cancelada' ? null : (
            <>
              {dados.status === 'Prevista' ? (
                <DialogoDePagamento despesa={dados} desabilitado={!editavel} />
              ) : null}
              <Button variant="outline" size="sm" disabled={!editavel} onClick={() => definirEditando(true)}>
                Editar
              </Button>
              {dados.status === 'Prevista' ? (
                <DialogoDeConfirmacao
                  gatilho={
                    <Button variant="outline" size="sm" disabled={!editavel || cancelar.isPending}>
                      Cancelar
                    </Button>
                  }
                  titulo={`Cancelar ${rotuloDaDespesa(dados)}?`}
                  descricao="A despesa sai do previsto e deixa de pesar no caixa. Cancelada é situação final: para voltar a prever este gasto, é lançar de novo."
                  rotuloDeCancelar="Voltar"
                  rotulo="Cancelar despesa"
                  destrutivo
                  aoConfirmar={() =>
                    cancelar.mutate(dados.id, {
                      onSuccess: () => toast.info('Despesa cancelada.'),
                      onError: (erro) => toast.error(mensagemDoErro(erro)),
                    })
                  }
                />
              ) : null}
            </>
          )
        }
      >
        <ListaDeDados>
          <Dado icone={Handshake} rotulo="Fornecedor">
            {/* O nome todo membro lê; o cadastro dele é da Tesouraria, e para os demais o link
                cairia na guarda de rota. Sem link, o nome continua dizendo a quem a turma pagou. */}
            {dados.fornecedor_id && dados.fornecedor ? (
              tesouraria ? (
                <Link to={rotaDoFornecedor(dados.fornecedor_id)} className="hover:underline">
                  {dados.fornecedor}
                </Link>
              ) : (
                dados.fornecedor
              )
            ) : (
              <span className="text-texto-muted">Sem fornecedor</span>
            )}
          </Dado>
          <Dado icone={Tag} rotulo="Categoria">
            {ROTULOS_DE_CATEGORIA[dados.categoria]}
          </Dado>
          <Dado icone={CalendarClock} rotulo="Competência">
            {formatarMesCurto(dados.competencia)}
          </Dado>
          <Dado icone={Layers} rotulo="Parcela">
            {dados.total_de_parcelas > 1
              ? `${formatarNumero(dados.numero)} de ${formatarNumero(dados.total_de_parcelas)}`
              : 'À vista'}
          </Dado>
          <Dado icone={CalendarClock} rotulo="Pagamento">
            {dados.pago_em ? (
              formatarData(dados.pago_em)
            ) : (
              <span className="text-texto-muted">Ainda não paga</span>
            )}
          </Dado>
          <Dado icone={FileText} rotulo="Comprovante">
            {/* O anexo costuma trazer conta e titular do fornecedor: abre só para a Tesouraria, e a
                API recusa o resto. Para os demais fica o fato — há comprovante guardado. */}
            {!dados.tem_comprovante ? (
              <span className="text-texto-muted">Sem anexo</span>
            ) : tesouraria ? (
              <button
                type="button"
                onClick={abrirComprovante}
                disabled={comprovante.isPending}
                className="text-brand-text cursor-pointer underline"
              >
                Abrir comprovante
              </button>
            ) : (
              'Anexado'
            )}
          </Dado>
        </ListaDeDados>
      </Cartao>

      {parcelada ? <ParcelasDoLancamento despesa={dados} /> : null}

      <DialogoDeDespesa
        aberto={editando ? { despesa: dados } : false}
        itensDaFesta={itensDaFesta}
        fornecedores={fornecedores}
        aoFechar={() => definirEditando(false)}
      />
    </>
  )
}

/**
 * As linhas do lançamento a que a despesa pertence.
 *
 * Os dois blocos do lançamento — a faixa e a tabela — pedem esta mesma consulta, e ficam em pontos
 * diferentes da tela: um acima do cartão de detalhe, outro abaixo. A `queryKey` é a mesma nos dois,
 * então o React Query busca uma vez só.
 *
 * Cem linhas de página: a parcelada mais longa que o formulário aceita cabe numa consulta, e
 * paginar as parcelas de um único lançamento não ajudaria ninguém.
 *
 * @param lancamento_id O lançamento.
 */
function useLancamento(lancamento_id: string) {
  return useDespesas({ lancamento_id, tamanho: TAMANHO_DA_PAGINA })
}

/** O compromisso inteiro em números: quanto é, quanto saiu e quanto falta. */
function ResumoDoLancamento({ despesa }: { despesa: Despesa }) {
  const irmas = useLancamento(despesa.lancamento_id).data?.itens

  // Cancelada não é compromisso: ela saiu da conta quando foi cancelada, e somá-la inflaria o total.
  const vigentes = (irmas ?? []).filter((linha) => linha.status !== 'Cancelada')
  const pagas = vigentes.filter((linha) => linha.status === 'Paga')
  const previstas = vigentes.filter((linha) => linha.status === 'Prevista')

  /** Enquanto a consulta não volta, o esqueleto do indicador guarda a altura da faixa. */
  const reais = (linhas: Despesa[]) => (irmas === undefined ? null : formatarCentavos(somar(linhas)))

  return (
    <FaixaDeIndicadores
      rotulo="Resumo do lançamento"
      indicadores={[
        { rotulo: 'Total do lançamento', valor: reais(vigentes), icone: Receipt },
        { rotulo: 'Pago', valor: reais(pagas), icone: CircleCheck },
        {
          rotulo: 'Ainda a pagar',
          valor: reais(previstas),
          icone: Wallet,
          sinal: previstas.some((linha) => linha.atrasada)
            ? { texto: 'atrasada', tom: 'negativo' }
            : undefined,
        },
        {
          rotulo: 'Parcelas pagas',
          valor: irmas === undefined ? null : pagas.length,
          unidade: `de ${formatarNumero(vigentes.length)}`,
          icone: Layers,
        },
      ]}
    />
  )
}

/**
 * As parcelas irmãs, na mesma tabela da tela de Despesas.
 *
 * A linha aberta fica marcada e não é link — as outras levam para o detalhe delas. É o que "2 de 3"
 * não contava: se a 1 já foi paga, e quando vence a 3.
 */
function ParcelasDoLancamento({ despesa }: { despesa: Despesa }) {
  const irmas = useLancamento(despesa.lancamento_id)
  const itens = irmas.data?.itens ?? []

  return (
    <Cartao
      titulo="Parcelas deste lançamento"
      icone={Layers}
      descricao={`${despesa.descricao} — ${formatarNumero(despesa.total_de_parcelas)} parcelas mensais.`}
    >
      {irmas.isPending ? <EsqueletoDeTabela linhas={4} colunas={5} /> : null}

      {irmas.isError ? <ErroDaConsulta erro={irmas.error} /> : null}

      {itens.length > 0 ? (
        <Tabela
          cabecalho={
            <>
              <th className="py-3 pr-4 font-normal">Parcela</th>
              <th className="py-3 pr-4 font-normal">Vencimento</th>
              <th className="py-3 pr-4 text-right font-normal">Valor</th>
              <th className="py-3 font-normal">Situação</th>
            </>
          }
        >
          {itens.map((linha) => (
            <tr
              key={linha.id}
              className={cn('border-b last:border-0', linha.id === despesa.id && 'bg-border/40')}
            >
              <th scope="row" className="text-foreground py-3 pr-4 text-left font-normal">
                {linha.id === despesa.id ? (
                  <>
                    {formatarNumero(linha.numero)} de {formatarNumero(linha.total_de_parcelas)}{' '}
                    <span className="text-texto-muted text-xs">nesta tela</span>
                  </>
                ) : (
                  <Link to={rotaDaDespesa(linha.id)} className="hover:underline">
                    {formatarNumero(linha.numero)} de {formatarNumero(linha.total_de_parcelas)}
                  </Link>
                )}
              </th>
              <td className="text-muted-foreground py-3 pr-4 whitespace-nowrap">
                {formatarData(linha.vencimento)}
              </td>
              <td className="py-3 pr-4 text-right whitespace-nowrap">
                {formatarCentavos(linha.valor_em_centavos)}
              </td>
              <td className="py-3">
                <SituacaoDaDespesa despesa={linha} />
              </td>
            </tr>
          ))}
        </Tabela>
      ) : null}
    </Cartao>
  )
}
