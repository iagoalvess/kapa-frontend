import { LinkDaPagina } from '@/components/LinkDaPagina'
import { ROTAS } from '@/config/rotas'
import { useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { useFormaturaAtiva, usePapel } from '@/hooks/useSessao'
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
    case 'Suspensa':
      return {
        tom: 'perigo',
        texto:
          'O plano da turma venceu. Todos continuam vendo o que o plano incluía, mas nada novo pode ser registrado até renovar.',
        acao: 'Renovar plano',
      }
    case 'Encerrada':
      return {
        tom: 'neutro',
        texto: `Formatura encerrada em ${formatarData(formatura.encerrada_em)}. Consulta e exportação continuam disponíveis.`,
      }
    case 'Ativa':
    case 'Descartada':
      return null
  }
}

/**
 * Banner fixo do `LayoutApp`, em toda tela, quando a formatura selecionada não está ativa.
 *
 * Cobra-se com banner, não com sequestro de dado: suspensa continua lendo os módulos do plano que tinha
 * (decisão do dono de 06/10/2026), e só a escrita para.
 *
 * O botão para os planos aparece só para o Presidente, que é quem contrata: para o resto da
 * comissão ele levaria a uma tela onde não há o que fazer.
 */
export function FaixaDeStatus() {
  const { data } = useFormaturaAtual()
  const { ehPresidente } = usePapel()
  const { desligadoEm } = useFormaturaAtiva()

  // Vem antes do status da turma: para quem saiu, "o plano da turma venceu" não é a informação que
  // falta. A saída explica tudo o que ele deixou de ver, e é a única frase que ele precisa ler.
  const conteudo = desligadoEm
    ? {
        tom: 'neutro' as const,
        texto: `Você foi desligado desta turma em ${formatarData(desligadoEm)}. Seu histórico de pagamentos e o seu termo continuam disponíveis; para voltar, fale com a comissão.`,
      }
    : data
      ? faixa(data)
      : null

  if (!conteudo) return null

  return (
    <output
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium',
        TONS[conteudo.tom],
      )}
    >
      {conteudo.texto}
      {ehPresidente && 'acao' in conteudo && conteudo.acao ? (
        <LinkDaPagina to={ROTAS.planos} className="underline underline-offset-4">
          {conteudo.acao}
        </LinkDaPagina>
      ) : null}
    </output>
  )
}
