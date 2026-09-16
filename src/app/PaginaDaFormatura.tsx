import { CalendarCheck, Flag, type LucideIcon, PartyPopper, Users } from 'lucide-react'
import { EsqueletoDeCartao, EsqueletoDeCartoes, EsqueletoDeDados } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores, type Indicador } from '@/components/FaixaDeIndicadores'
import { PAPEIS } from '@/config/perfis'
import { CartaoDeAssinatura } from '@/features/assinaturas'
import { CartaoDeConvitesPorEmail, CartaoDoLinkDaTurma } from '@/features/convites'
import { ChaveDeRecebimento, ComoODinheiroChega } from '@/features/recebimentos'
import { CicloDaFormatura, DadosDaFormatura } from '@/features/formaturas'
import { contar, useResumoDeMembros } from '@/features/membros'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { diasAte, formatarData, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { FormaturaDetalhe, StatusDaFormatura } from '@/types/formatura'

/**
 * Curto de propósito: vai no número grande da faixa. `Rascunho` é nome interno — para quem usa, a
 * turma que ainda não assinou plano está "a contratar"; com o checkout aberto, "a pagar".
 */
const SITUACOES: Record<StatusDaFormatura, Pick<Indicador, 'valor' | 'sinal'>> = {
  // Sem sinal: o texto é longo demais para dividir a linha, e a faixa de status do topo já avisa.
  Rascunho: { valor: 'A contratar' },
  AguardandoPagamento: { valor: 'A pagar', sinal: { texto: 'pendente', tom: 'negativo' } },
  Ativa: { valor: 'Ativa', sinal: { texto: 'em dia', tom: 'positivo' } },
  Suspensa: { valor: 'Suspensa' },
  Encerrada: { valor: 'Encerrada' },
  Descartada: { valor: 'Descartada' },
}

/**
 * Uma data prevista como contagem regressiva: "312 dias", com a data no rótulo. Sem data, "A
 * definir"; já passada, a própria data.
 */
function contagemAte(rotulo: string, data: string | null | undefined, icone: LucideIcon): Indicador {
  const dias = diasAte(data)

  if (dias === null) return { rotulo, valor: 'A definir', icone }
  if (dias < 0) return { rotulo, valor: formatarData(data), icone }
  if (dias === 0) return { rotulo, valor: 'Hoje', icone }
  return {
    rotulo: `${rotulo} · ${formatarData(data)}`,
    valor: dias,
    unidade: dias === 1 ? 'dia' : 'dias',
    icone,
  }
}

/**
 * A formatura numa tela só: situação e datas no topo; à esquerda os dados cadastrais e, para a
 * Gestão, os convites por e-mail; à direita, também da Gestão, a assinatura, o link da turma e o fim
 * da vida da formatura.
 *
 * Mora em `app/` porque compõe várias features, e uma feature não importa de outra.
 */
export default function PaginaDaFormatura() {
  const formatura = useFormaturaAtual()
  const { tem } = usePapel()
  const gestao = tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const tesouraria = tem(PAPEIS.tesoureiro)

  // O desenho que vem: a faixa de números e, embaixo, a coluna de cartões (duas, para a gestão).
  if (formatura.isPending)
    return (
      <>
        <EsqueletoDeCartoes quantidade={1} altura="h-32" className="md:grid-cols-1" />
        <div
          className={cn(
            'grid items-start gap-5',
            gestao && 'lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]',
          )}
        >
          <EsqueletoDeCartao>
            <EsqueletoDeDados linhas={5} />
          </EsqueletoDeCartao>
          {gestao ? <EsqueletoDeCartao /> : null}
        </div>
      </>
    )

  if (formatura.isError) return <ErroDaConsulta erro={formatura.error} />

  const dados = formatura.data

  return (
    <>
      <FaixaDaFormatura formatura={dados} gestao={gestao} />

      <div
        className={cn('grid items-start gap-5', gestao && 'lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]')}
      >
        {gestao ? (
          <>
            {/* A chave PIX morava numa tela só dela, visitada duas vezes na vida da turma: uma para
                cadastrar, outra para conferir. Aqui ela fica onde já se ajusta a turma — e só para a
                Tesouraria, o mesmo recorte que a rota tinha. */}
            <div className="grid gap-5">
              <DadosDaFormatura formatura={dados} />
              <CartaoDeConvitesPorEmail />
              {tesouraria ? <ChaveDeRecebimento /> : null}
            </div>
            <div className="grid gap-5">
              <CartaoDeAssinatura />
              <CartaoDoLinkDaTurma />
              {tesouraria ? <ComoODinheiroChega /> : null}
              <CicloDaFormatura formatura={dados} />
            </div>
          </>
        ) : (
          <DadosDaFormatura formatura={dados} />
        )}
      </div>
    </>
  )
}

/**
 * Situação, colação, festa e tamanho. A Gestão vê quantos já estão na turma contra a estimativa;
 * o formando, que não lê a lista de membros, vê só a estimativa.
 */
function FaixaDaFormatura({ formatura, gestao }: { formatura: FormaturaDetalhe; gestao: boolean }) {
  const resumo = useResumoDeMembros(gestao)
  const estimados = formatura.quantidade_estimada_de_formandos

  const tamanho: Indicador = gestao
    ? {
        rotulo: 'Na turma',
        valor: resumo.data ? contar(resumo.data, { ativo: true }) : null,
        unidade: `de ${formatarNumero(estimados)}`,
        icone: Users,
      }
    : { rotulo: 'Formandos estimados', valor: estimados, icone: Users }

  return (
    <FaixaDeIndicadores
      rotulo="Resumo da formatura"
      indicadores={[
        { rotulo: 'Situação', ...SITUACOES[formatura.status], icone: Flag },
        contagemAte('Colação', formatura.previsao_de_colacao, CalendarCheck),
        contagemAte('Festa', formatura.previsao_da_festa, PartyPopper),
        tamanho,
      ]}
    />
  )
}
