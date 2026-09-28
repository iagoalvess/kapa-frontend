import { cn } from '@/lib/utils'

/**
 * A chave de ligar e desligar que grava na hora — sem formulário e sem diálogo, porque desligar não
 * apaga nada e ligar de novo é o mesmo clique.
 *
 * Mora em `components/` porque é a chave de liga-e-desliga do produto: hoje só a régua de cobrança
 * (Sprint 13) a usa, e o cartão da turma (Sprint 39) é o próximo.
 *
 * @param ligado Se está ligado agora.
 * @param rotulo O nome para o leitor de tela — a chave não tem texto próprio.
 * @param aoAlternar Chamado com o valor novo.
 * @param desabilitado Enquanto grava, ou sem permissão.
 */
export function Interruptor({
  ligado,
  rotulo,
  aoAlternar,
  desabilitado = false,
}: {
  ligado: boolean
  rotulo: string
  aoAlternar: (ligado: boolean) => void
  desabilitado?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      disabled={desabilitado}
      onClick={() => aoAlternar(!ligado)}
      className={cn(
        'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 disabled:cursor-default disabled:opacity-50',
        ligado ? 'bg-brand' : 'bg-border',
      )}
    >
      <span
        className={cn(
          'bg-card size-4 rounded-full shadow-sm transition-transform',
          ligado && 'translate-x-4',
        )}
      />
    </button>
  )
}
