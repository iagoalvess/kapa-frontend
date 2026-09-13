import { Link } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarData } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { FormaturaDetalhe } from '@/types/formatura'

const TONS = {
  alerta: 'bg-warning-bg text-warning-text',
  perigo: 'bg-danger-bg text-danger-text',
  neutro: 'bg-neutral-bg text-neutral-text',
} as const

function faixa(formatura: FormaturaDetalhe): { tom: keyof typeof TONS; texto: string; acao?: string } | null {
  switch (formatura.status) {
    case 'Rascunho':
    case 'AguardandoPagamento':
      return {
        tom: 'alerta',
        texto: 'Sua formatura ainda não está ativa. Chame a comissão e conclua a contratação.',
        acao: 'Contratar',
      }
    case 'Suspensa':
      return {
        tom: 'perigo',
        texto: 'Assinatura pendente. A turma está em modo leitura.',
        acao: 'Regularizar',
      }
    case 'Encerrada':
      return {
        tom: 'neutro',
        texto: `Formatura encerrada em ${formatarData(formatura.encerradaEm)}. Consulta e exportação continuam disponíveis.`,
      }
    case 'Ativa':
    case 'Descartada':
      return null
  }
}

/**
 * Banner fixo do `LayoutApp`, em toda tela, quando a formatura selecionada não está ativa.
 *
 * Cobra-se com banner, não com sequestro de dado: suspensa continua lendo tudo.
 *
 * O botão para os planos aparece só para o Presidente, que é quem contrata: para o resto da
 * comissão ele levaria a uma tela onde não há o que fazer.
 */
export function FaixaDeStatus() {
  const { data } = useFormaturaAtual()
  const { ehPresidente } = usePapel()
  const conteudo = data ? faixa(data) : null

  if (!conteudo) return null

  return (
    <output
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium',
        TONS[conteudo.tom],
      )}
    >
      {conteudo.texto}
      {ehPresidente && conteudo.acao ? (
        <Link to={ROTAS.planos} className="underline underline-offset-4">
          {conteudo.acao}
        </Link>
      ) : null}
    </output>
  )
}
