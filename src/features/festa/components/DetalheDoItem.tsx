import { CircleCheck, Coins, Users } from 'lucide-react'
import { Cartao } from '@/components/Cartao'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { TextoEmMarkdown } from '@/components/TextoEmMarkdown'
import { Button } from '@/components/ui/button'
import { useAbrirArquivoDoAcervo } from '@/hooks/useAcervoDaTurma'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { type ItemDaFesta, percentualDaMeta, type Proposta } from '@/types/festa'
import { ROTULOS_DE_CATEGORIA } from '@/types/financeiro'
import { ICONE_DA_CATEGORIA } from './iconeDaCategoria'
import { Propostas } from './Propostas'
import { SeloDoItem } from './SeloDoItem'

interface Props {
  item: ItemDaFesta
  propostas: Proposta[]
  /** A Gestão vê as ações; o formando, só o conteúdo. */
  ehGestao: boolean
  /** Falso esconde as ações de escrita — formatura fora de `Ativa`. */
  editavel: boolean
  /** Só a Tesouraria lança despesa, e é ela quem contrata. */
  podeContratar: boolean
  aoEditar: () => void
  aoContratar: () => void
  aoCancelar: () => void
  aoReativar: () => void
  aoExcluir: () => void
}

/**
 * O item aberto: o que é, o que vai ter, as propostas, o dinheiro e o contrato.
 *
 * É o painel da direita, e é ele que responde a pergunta da tela inteira — "pelo que eu estou
 * pagando?". Por isso a descrição vem antes do dinheiro, e o dinheiro antes das ações: quem abre
 * quer ler, não administrar. Coube aqui o que não cabia num cartão de grade — as propostas com
 * preço e voto, e o Markdown inteiro em vez de três linhas cortadas.
 */
export function DetalheDoItem({
  item,
  propostas,
  ehGestao,
  editavel,
  podeContratar,
  aoEditar,
  aoContratar,
  aoCancelar,
  aoReativar,
  aoExcluir,
}: Props) {
  const { abrir, abrindo } = useAbrirArquivoDoAcervo()
  const Icone = ICONE_DA_CATEGORIA[item.categoria]
  const contrato = item.documento
  const porFormando = item.rateio === 'PorFormando'
  // O mesmo arredondamento da meta da Página Inicial: item sem contrato é 0%, e pagar a mais não
  // passa de 100 — a barra não sai da borda.
  const pagoDoItem = percentualDaMeta(item.pago_em_centavos, item.contratado_em_centavos)
  const faltaPagar = Math.max(0, item.contratado_em_centavos - item.pago_em_centavos)

  return (
    <Cartao
      titulo={item.titulo}
      icone={Icone}
      selo={<SeloDoItem estado={item.estado} />}
      descricao={
        <>
          {ROTULOS_DE_CATEGORIA[item.categoria]}
          {item.fornecedor ? ` · ${item.fornecedor}` : ''}
        </>
      }
      acao={
        <div className="flex flex-wrap items-center gap-2">
          {/* O contrato é a prova do que a turma comprou, e por isso encosta à direita do título,
              junto das ações — e não solto no pé do cartão, onde competia com as propostas. O
              arquivo continua no acervo: quem confere formatura e visibilidade é o endpoint de lá,
              de novo, a cada clique. */}
          {contrato ? (
            // Rótulo fixo, e o nome do arquivo só para o leitor de tela: o título vem do acervo e
            // tem o tamanho que a comissão digitou — na linha de ações ele empurrava as outras.
            <Button
              size="sm"
              variant="outline"
              disabled={abrindo}
              aria-label={`Abrir ${contrato.titulo}`}
              onClick={() => abrir(contrato)}
            >
              Contrato
            </Button>
          ) : null}

          {ehGestao && editavel ? (
            item.cancelado ? (
              <Button size="sm" variant="outline" onClick={aoReativar}>
                Reativar
              </Button>
            ) : (
              <>
                {podeContratar && item.quantidade_de_despesas === 0 ? (
                  <Button size="sm" onClick={aoContratar}>
                    Contratar
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={aoEditar}>
                  Editar
                </Button>
                {item.quantidade_de_despesas === 0 ? (
                  <Button size="sm" variant="outline" onClick={aoExcluir}>
                    Excluir
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={aoCancelar}>
                    Cancelar
                  </Button>
                )}
              </>
            )
          ) : null}
        </div>
      }
    >
      {item.o_que_inclui ? (
        <TextoEmMarkdown conteudo={item.o_que_inclui} />
      ) : (
        <p className="text-texto-muted text-sm">
          {ehGestao
            ? 'Sem descrição. Diga o que vai ter para a turma saber pelo que está pagando.'
            : 'A comissão ainda não descreveu o que vai ter.'}
        </p>
      )}

      <ListaDeDados>
        <Dado icone={Coins} rotulo={item.quantidade_de_despesas > 0 ? 'Contratado' : 'Orçado'}>
          {item.custo_em_centavos > 0 ? (
            formatarCentavos(item.custo_em_centavos)
          ) : (
            <span className="text-texto-muted">Sem orçamento</span>
          )}
        </Dado>

        {porFormando ? (
          <Dado icone={Users} rotulo="Por formando">
            {formatarCentavos(item.valor_previsto_em_centavos)}
            {/* A expectativa some quando existe despesa: dali em diante o custo é a soma delas, e
                deixar "× 40 estimados" ao lado do contratado é mostrar dois números para a mesma
                coisa, um deles morto. */}
            {item.quantidade_de_despesas === 0 ? (
              <span className="text-muted-foreground">
                {' '}
                × {formatarNumero(item.quantidade_estimada)} estimados
              </span>
            ) : null}
          </Dado>
        ) : null}

        {item.quantidade_de_despesas > 0 ? (
          <Dado icone={CircleCheck} rotulo="Já pago">
            {formatarCentavos(item.pago_em_centavos)}
            {item.cancelado ? null : (
              <>
                {/* A barra é decoração, e por isso `aria-hidden`: quem lê por leitor de tela ouve a
                    linha abaixo, que diz o mesmo em número. Isso vale mais que um `progressbar`
                    sem texto, e é o motivo de os dois andarem juntos. */}
                <span aria-hidden className="bg-border mt-2 block h-3 overflow-hidden rounded-full">
                  <span className="bg-brand block h-full rounded-full" style={{ width: `${pagoDoItem}%` }} />
                </span>
                {/* O percentual e o que falta em texto, e não só a barra: barra sozinha se lê "mais
                    ou menos pela metade", e a turma inteira lê esta tela para saber exatamente
                    quanto ainda vai sair do caixa. */}
                <span className="text-muted-foreground mt-1.5 block text-sm font-normal">
                  {pagoDoItem}% pago
                  {faltaPagar > 0 ? ` · falta ${formatarCentavos(faltaPagar)}` : ' · quitado'}
                </span>
              </>
            )}
          </Dado>
        ) : null}
      </ListaDeDados>

      <Propostas item={item} propostas={propostas} ehGestao={ehGestao} editavel={editavel} />
    </Cartao>
  )
}
