import { CORES_DE_TIPO, type TipoDeCobranca } from '@/types/cobranca'
import { cn } from '@/lib/utils'
import { ICONES_DE_TIPO } from './iconesDeTipo'

/**
 * O círculo da parcela (`CORES_DE_TIPO`), esmaecido como as pílulas da agenda: mesmo tom, para o
 * item se reconhecer de uma tela para a outra. Escritas por extenso: o Tailwind lê o código como
 * texto, e `${cor}/20` não seria gerada.
 */
const ESMAECIDAS: Record<string, string> = {
  'bg-avatar-1': 'bg-avatar-1/20',
  'bg-avatar-2': 'bg-avatar-2/20',
  'bg-avatar-3': 'bg-avatar-3/20',
  'bg-avatar-4': 'bg-avatar-4/20',
  'bg-avatar-6': 'bg-avatar-6/20',
  'bg-avatar-7': 'bg-avatar-7/20',
  'bg-avatar-8': 'bg-avatar-8/20',
}

/** O bloco do ícone de um item — vitrine, pedidos e plano. */
export function IconeDoTipo({ tipo }: { tipo: TipoDeCobranca }) {
  const Icone = ICONES_DE_TIPO[tipo]

  return (
    <span
      className={cn(
        'text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg',
        ESMAECIDAS[CORES_DE_TIPO[tipo]],
      )}
    >
      <Icone className="size-4.5" strokeWidth={1.75} aria-hidden />
    </span>
  )
}
