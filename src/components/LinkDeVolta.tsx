import { ArrowLeft } from 'lucide-react'
import { type ReactNode, useContext } from 'react'
import { Link } from 'react-router'
import { ContextoDeVoltaDaPagina, useOrigemDaNavegacao } from '@/hooks/useNavegacaoDaPagina'
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
 * A origem de `LinkDaPagina` tem prioridade; quando a moldura já a mostra, esta saída não se repete.
 *
 * @param para A saída para acesso direto, de `config/rotas`.
 * @param children O nome da saída fixa — "Despesas", "Membros".
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
  const voltaNoLayout = useContext(ContextoDeVoltaDaPagina)
  const origem = useOrigemDaNavegacao()
  // A moldura já oferece a origem real; a saída fixa continua para acessos diretos.
  if (voltaNoLayout) return null

  return (
    <Link
      to={origem?.caminho ?? para}
      state={origem?.estado}
      className={cn(
        'text-brand-text inline-flex w-fit items-center gap-1 text-sm hover:underline',
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {origem?.titulo ?? children}
    </Link>
  )
}
