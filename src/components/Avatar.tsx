import { cn } from '@/lib/utils'

// Classes escritas por extenso: o Tailwind só gera o que encontra literalmente no código.
const CORES = [
  'bg-avatar-1',
  'bg-avatar-2',
  'bg-avatar-3',
  'bg-avatar-4',
  'bg-avatar-5',
  'bg-avatar-6',
] as const

/** Mesma pessoa, mesma cor em toda tela: a cor sai de uma soma simples sobre o id. */
function corDe(semente: string) {
  let soma = 0
  for (const caractere of semente) soma = (soma + caractere.charCodeAt(0)) % CORES.length
  return CORES[soma]
}

/**
 * Círculo com a inicial ou foto da pessoa, no pastel que o id dela sorteia.
 *
 * Decorativo: o nome sempre aparece ao lado, então o leitor de tela pula o círculo.
 *
 * @param nome De onde sai a inicial.
 * @param semente O que decide a cor — o id, para não mudar quando o nome muda.
 * @param foto Caminho da imagem (opcional). Quando fornecida, exibe o avatar com a foto.
 */
export function Avatar({
  nome,
  semente,
  foto,
  className,
}: {
  nome: string
  semente: string
  foto?: string
  className?: string
}) {
  if (foto) {
    return (
      <img
        src={foto}
        alt=""
        aria-hidden
        className={cn('size-6 shrink-0 rounded-full object-cover', className)}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white',
        corDe(semente),
        className,
      )}
    >
      {nome.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
