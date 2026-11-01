import { useId } from 'react'
import { cn } from '@/lib/utils'

/** A escolha fica no formulário; Salvar pede confirmação antes de alterar o modo da turma. */
export function ModoDaCobranca({
  selecionada,
  escreve,
  ocupado,
  aoSelecionar,
}: {
  selecionada: boolean
  escreve: boolean
  ocupado: boolean
  aoSelecionar: (automatica: boolean) => void
}) {
  const grupo = useId()
  return (
    <section aria-label="Cobrança dos formandos" className="grid gap-3">
      <fieldset className="grid gap-3">
        <legend className="text-foreground text-base font-medium">Parcelas e itens opcionais</legend>
        <div className="divide-border grid divide-y">
          {[
            {
              automatica: false,
              titulo: 'Conferência manual',
              descricao: 'PIX, transferência ou dinheiro. A tesouraria confere.',
            },
            {
              automatica: true,
              titulo: 'Confirmação automática',
              descricao: 'PIX ou cartão pelo Mercado Pago. O Kapa confirma.',
            },
          ].map(({ automatica, titulo, descricao }) => {
            const ativo = selecionada === automatica
            const desabilitado = !escreve || ocupado

            return (
              <label
                key={titulo}
                className={cn('flex items-start gap-3 py-3', !desabilitado && 'cursor-pointer')}
              >
                <input
                  type="radio"
                  name={grupo}
                  aria-label={titulo}
                  checked={ativo}
                  disabled={desabilitado}
                  onChange={() => aoSelecionar(automatica)}
                  className="accent-brand focus-visible:ring-ring mt-1 size-4 shrink-0 focus-visible:ring-2 focus-visible:outline-none"
                />
                <span className="grid min-w-0 gap-1">
                  <span className={cn('text-foreground text-[15px] font-medium', ativo && 'text-brand-text')}>
                    {titulo}
                  </span>
                  <span className="text-muted-foreground text-sm">{descricao}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </section>
  )
}
