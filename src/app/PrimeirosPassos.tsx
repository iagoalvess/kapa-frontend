import { ArrowRight, Check, Users } from 'lucide-react'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Selo } from '@/components/Selo'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useConteudoParaAdesao } from '@/features/adesoes'
import { usePlanos } from '@/features/cobrancas'
import { contar, useResumoDeMembros } from '@/features/membros'
import { useContaDeRecebimento, useMercadoPago } from '@/features/recebimentos'
import type { FormaturaDetalhe } from '@/types/formatura'
import { Rotulo } from './RotuloDoBloco'

/** Um passo do caminho: o que fazer e a porta, enquanto não está feito. */
interface Passo {
  titulo: string
  feito: boolean
  para: string
  descricao: string
  opcional?: boolean
}

/**
 * O caminho da comissão até a turma estar rodando, no Início.
 *
 * Derivado do que já existe — não há campo de "viu o guia": a comissão entra, o bloco diz o que
 * falta e só some quando há cobrança, termo, recebimento e pelo menos um formando na turma.
 * Convidar alguém antes de preparar o restante não termina a configuração.
 *
 * Um bloco de fio e rótulo, como o resto do Início — não um cartão: a tela não é uma grade de
 * superfícies, e a lista de passos se lê como as próximas datas.
 *
 * Só Presidente e Tesouraria o veem, pois as consultas financeiras exigem esses papéis. Enquanto os dados não
 * chegam (ou falham), não aparece: guia errado é pior que guia nenhum.
 *
 * @param turma A formatura da sessão: o status decide se o guia faz sentido, e `ja_contratou` marca
 *   o passo do plano.
 */
export function PrimeirosPassos({ turma }: { turma: FormaturaDetalhe }) {
  const { data: resumo } = useResumoDeMembros()
  const { data: planos } = usePlanos()
  const { data: conteudo } = useConteudoParaAdesao()
  const { data: recebimento } = useContaDeRecebimento()
  const { data: mercadoPago } = useMercadoPago()

  if (
    turma.status !== 'Ativa' ||
    resumo === undefined ||
    planos === undefined ||
    conteudo === undefined ||
    recebimento === undefined ||
    mercadoPago === undefined
  )
    return null

  const daGestao = [PAPEIS.presidente, PAPEIS.tesoureiro, PAPEIS.comissao].reduce(
    (total, papel) => total + contar(resumo, { ativo: true, papel }),
    0,
  )
  const formandos = contar(resumo, { ativo: true, papel: PAPEIS.formando })
  const cobrancaEmVigor = planos.some((plano) => plano.status === 'Vigente')

  const conta = recebimento.conta
  const recebimentoPronto = Boolean(
    mercadoPago.provedor?.cobranca_automatica_em ||
    conta?.meios.transferencia ||
    conta?.meios.dinheiro ||
    (conta?.meios.pix && conta.conferida_em),
  )

  const passos: Passo[] = [
    {
      titulo: 'Monte a comissão',
      feito: daGestao > 1,
      para: ROTAS.formatura + '#convites',
      descricao: 'Opcional: divida as tarefas com a tesouraria e a comissão.',
      opcional: true,
    },
    {
      titulo: 'Monte o plano de cobrança',
      feito: cobrancaEmVigor,
      para: ROTAS.cobrancas,
      descricao: 'Defina valores, parcelas e vencimentos e coloque o plano em vigor.',
    },
    {
      titulo: 'Publique o termo de adesão',
      feito: Boolean(conteudo.termo),
      para: ROTAS.adesoes,
      descricao: 'O presidente publica as condições que os formandos vão aceitar.',
    },
    {
      titulo: 'Configure os recebimentos',
      feito: recebimentoPronto,
      para: ROTAS.formatura + '#recebimentos',
      descricao: 'O presidente define os meios de pagamento e confere o titular do PIX.',
    },
    {
      titulo: 'Contrate o plano',
      feito: turma.ja_contratou,
      para: ROTAS.planos,
      descricao: 'A assinatura permite a entrada dos formandos na turma.',
    },
    {
      titulo: 'Convide os formandos',
      feito: formandos > 0,
      para: ROTAS.formatura + '#convites',
      descricao: 'Envie convites por e-mail ou compartilhe o link e acompanhe a entrada.',
    },
  ]
  const necessarios = passos.filter((passo) => !passo.opcional)
  const concluidos = necessarios.filter((passo) => passo.feito).length
  if (concluidos === necessarios.length) return null

  /*
    A numeração é só dos passos obrigatórios: o opcional ("Monte a comissão") não entra na conta do
    "de 5" nem na sequência — antes ele abria a lista como "1", empurrando os cinco numerados para
    2..6, e o cabeçalho dizendo 5 não batia com os seis itens na tela.
  */
  const itens = passos.reduce<{ passo: Passo; numero: number | null }[]>((lista, passo) => {
    const numero = passo.opcional ? null : lista.filter((item) => item.numero !== null).length + 1
    return [...lista, { passo, numero }]
  }, [])

  return (
    <section aria-labelledby="bloco-primeiros-passos" className="border-b pt-8 pb-9">
      <Rotulo id="bloco-primeiros-passos">Primeiros passos</Rotulo>
      <p className="text-muted-foreground mt-2 text-sm">
        {concluidos} de {necessarios.length} etapas concluídas para começar. Monte a turma antes de chamar os
        formandos.
      </p>

      <ol className="mt-4 grid">
        {itens.map(({ passo, numero }) => (
          <li key={passo.titulo} className="border-border border-b last:border-0">
            {passo.feito ? (
              <div className="flex min-w-0 items-center gap-3 py-3.5">
                <span className="bg-success text-on-brand grid size-7 shrink-0 place-items-center rounded-full">
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-muted-foreground min-w-0 flex-1 text-[15px]">{passo.titulo}</span>
                {passo.opcional ? <Selo tom="cinza">Opcional</Selo> : null}
                <span className="sr-only">Concluído</span>
              </div>
            ) : (
              // O passo pendente é o próprio link: um "Fazer" ao lado repetiria o título, e dois
              // passos que levam à mesma tela teriam o mesmo nome acessível.
              <LinkDaPagina
                to={passo.para}
                aria-label={passo.titulo}
                className="hover:bg-muted/60 focus-visible:ring-ring -mx-2 flex min-w-0 items-center gap-3 rounded-xl px-2 py-3.5 outline-none focus-visible:ring-2"
              >
                {numero === null ? (
                  <span
                    aria-hidden
                    className="bg-muted text-muted-foreground grid size-7 shrink-0 place-items-center rounded-full"
                  >
                    <Users className="size-3.5" strokeWidth={1.75} />
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="bg-brand-tint text-brand-text grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums"
                  >
                    {numero}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="text-brand-text flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                    {passo.titulo}
                    {passo.opcional ? <Selo tom="cinza">Opcional</Selo> : null}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-sm">{passo.descricao}</span>
                </span>
                <ArrowRight className="text-brand-text size-4 shrink-0" aria-hidden />
              </LinkDaPagina>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
