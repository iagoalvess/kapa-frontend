import { TriangleAlert } from 'lucide-react'

/**
 * Antes do primeiro campo: de quem é a conta. Muitas turmas não têm CNPJ e recebem no CPF do
 * tesoureiro — funciona, mas concentra numa pessoa o dinheiro e a responsabilidade de todos.
 */
export function AvisoDeTitularidade() {
  return (
    <div className="bg-warning-bg text-warning-text flex gap-3 rounded-xl px-4 py-3 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="grid gap-1">
        <p className="font-medium">A conta é da turma, mesmo quando está no nome de alguém.</p>
        <p>
          Se a comissão tem CNPJ, use a chave dele. Sem CNPJ, a chave no CPF de alguém da comissão funciona,
          mas o dinheiro da turma passa pela conta pessoal dessa pessoa — e a responsabilidade por ele,
          inclusive perante a Receita, também. Combinem isso por escrito antes de a turma começar a pagar.
        </p>
      </div>
    </div>
  )
}
