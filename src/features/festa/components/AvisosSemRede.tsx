import { WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatarHorario } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { useSincronizarEntradas } from '../hooks/useConvitesDaFesta'
import type { EntradaSemRede } from '../types/convites.types'

const plural = (n: number, singular: string, varios: string) => (n === 1 ? singular : varios)

interface Props {
  /** A lista na tela é a última que chegou, e a rede caiu. */
  offline: boolean
  /** Quando a lista na tela foi gerada. */
  geradaEm: string
  /** O que foi marcado neste celular sem rede. */
  entradas: EntradaSemRede[]
  /** A API recebeu tudo: esvazia a fila do celular. */
  aoSincronizar: () => void
}

/**
 * Os dois avisos da portaria sem internet (decisões 7 e 16): a lista envelheceu, e há entradas marcadas no
 * celular esperando subir. Na portaria da Gestão e na do celular liberado por link.
 */
export function AvisosSemRede({ offline, geradaEm, entradas, aoSincronizar }: Props) {
  const sincronizar = useSincronizarEntradas()
  return (
    <>
      {offline ? (
        <p
          role="alert"
          className="bg-warning-bg text-warning-text flex items-start gap-2 rounded-xl p-4 text-sm"
        >
          <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          Sem internet. A lista é de {formatarHorario(geradaEm)} — um convite revogado depois disso ainda
          aparece válido aqui. Confira nome e documento e registre a entrada no celular.
        </p>
      ) : null}

      {entradas.length > 0 ? (
        <div className="bg-warning-bg text-warning-text flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 text-sm">
          <span>
            {entradas.length} {plural(entradas.length, 'entrada registrada', 'entradas registradas')} neste
            celular, aguardando internet.
          </span>
          <Button
            size="sm"
            disabled={sincronizar.isPending}
            onClick={() =>
              sincronizar.mutate(entradas, {
                onSuccess: (r) => {
                  aoSincronizar()
                  toast.success(
                    `${r.validadas} ${plural(r.validadas, 'entrada registrada', 'entradas registradas')}` +
                      (r.repetidas
                        ? `, ${r.repetidas} já ${plural(r.repetidas, 'tinha', 'tinham')} entrado`
                        : '') +
                      (r.recusadas
                        ? `, ${r.recusadas} ${plural(r.recusadas, 'recusada', 'recusadas')}`
                        : '') +
                      '.',
                  )
                },
                onError: avisarErro,
              })
            }
          >
            {sincronizar.isPending ? 'Sincronizando…' : 'Sincronizar'}
          </Button>
        </div>
      ) : null}
    </>
  )
}
