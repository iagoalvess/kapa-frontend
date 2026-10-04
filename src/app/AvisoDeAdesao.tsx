import { FilePenLine } from 'lucide-react'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { MODULOS } from '@/config/planos'
import { ROTAS } from '@/config/rotas'
import { useAdesaoPendente } from '@/features/adesoes'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import { TracoDoInicio } from './TracoDoInicio'

/** O aceite é o passo que gera as parcelas. O menu sozinho não explica essa sequência. */
export function AvisoDeAdesao() {
  const { inclui } = usePlanoDaTurma()
  const pendente = useAdesaoPendente(inclui(MODULOS.termo))
  if (!pendente) return null

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-5">
        <span className="bg-brand-tint text-brand-text grid size-9 shrink-0 place-items-center rounded-full">
          <FilePenLine className="size-4.5" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="min-w-0 flex-1 text-sm">
          Seu termo está pronto. Confira as condições e o plano de cobrança: suas parcelas serão geradas
          depois do aceite, confirmado por um código enviado ao seu e-mail.
        </p>
        <LinkDaPagina to={ROTAS.adesao} className="text-brand-text text-sm font-semibold">
          Ler e aceitar termo
        </LinkDaPagina>
      </div>
      <TracoDoInicio className="h-3 w-full" />
    </>
  )
}
