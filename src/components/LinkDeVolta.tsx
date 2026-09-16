import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

/**
 * A saída de uma tela que se abre a partir de outra: a seta e o nome de onde se veio.
 *
 * **Primeiro elemento da página**, antes de qualquer cartão — é onde o olho procura, e é onde as
 * telas de detalhe (despesa, fornecedor, membro, pagamento) já o tinham. Era o mesmo link copiado
 * cinco vezes, em dois estilos diferentes; aqui ele tem um.
 *
 * Fica fora das consultas: some-lo enquanto a tela carrega faria o conteúdo saltar quando ela
 * voltasse, e tiraria a saída de quem caiu num erro.
 *
 * Não é migalha de pão: o app tem no máximo dois níveis, e a barra lateral já diz onde se está.
 *
 * @param para A rota de onde se veio, de `config/rotas`.
 * @param children O nome daquela tela — "Despesas", "Membros".
 */
export function LinkDeVolta({
  para,
  className,
  children,
}: {
  para: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      to={para}
      className={cn(
        'text-brand-text inline-flex w-fit items-center gap-1 text-sm hover:underline',
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {children}
    </Link>
  )
}
