import { toast } from 'sonner'
import { Select } from '@/components/Select'
import { useFormaturaAtiva } from '@/hooks/useSessao'
import { mensagemDoErro } from '@/lib/http/erros'
import { useMinhasFormaturas, useSelecionarFormatura } from '../hooks/useFormaturas'
import type { FormaturaDoUsuario } from '../types/formaturas.types'

/** "2027.1". Vazio na turma anterior ao cadastro completo, que ainda não tem ano. */
const turma = ({ ano, semestre }: FormaturaDoUsuario) =>
  ano ? [ano, semestre || null].filter(Boolean).join('.') : ''

/**
 * "Medicina · UFPR · 2027.1": o que separa duas turmas de nome parecido na hora de escolher.
 * Escolher a errada mostra o caixa de outra turma. Parte vazia (turma anterior ao cadastro
 * completo) some da descrição.
 */
export function descreverTurma(formatura: FormaturaDoUsuario) {
  return [formatura.curso, formatura.instituicao, turma(formatura)].filter(Boolean).join(' · ')
}

/**
 * A troca de turma, no menu do avatar — e **só** a troca.
 *
 * Com uma formatura só ele some: qual é a turma quem diz é o Início, e um seletor de uma opção só
 * é uma linha que não faz nada. Sem nenhuma selecionada some também, porque a tela de seleção já
 * está pedindo a escolha.
 *
 * A troca é o `Select` do sistema: a opção fechada já mostra curso, instituição e turma, o que
 * separa duas turmas de nome parecido — escolher a errada abre o caixa de outra formatura.
 *
 * @param habilitado Falso não consulta a lista. O menu do avatar está em toda tela, e quase todo
 *   mundo tem uma turma só — sem isto, toda tela pedia `/formaturas/minhas` para desenhar um
 *   seletor fechado que, na maioria das contas, nem aparece.
 */
export function SeletorDeFormatura({ habilitado = true }: { habilitado?: boolean }) {
  const { formaturaId } = useFormaturaAtiva()
  const formaturas = useMinhasFormaturas(habilitado)
  const selecionar = useSelecionarFormatura()

  const atual = formaturas.data?.find((formatura) => formatura.id === formaturaId)
  if (!formaturas.data || !atual || formaturas.data.length === 1) return null

  return (
    <div className="border-border grid gap-1 border-t px-3 py-3">
      <span className="text-texto-muted text-xs">Trocar de turma</span>
      <Select
        aria-label="Formatura selecionada"
        title={descreverTurma(atual)}
        className="h-9 w-full truncate text-sm font-medium"
        value={atual.id}
        disabled={selecionar.isPending}
        onChange={(evento) =>
          selecionar.mutate(evento.target.value, { onError: (erro) => toast.error(mensagemDoErro(erro)) })
        }
      >
        {formaturas.data.map((formatura) => (
          <option key={formatura.id} value={formatura.id}>
            {descreverTurma(formatura) || formatura.nome}
          </option>
        ))}
      </Select>
    </div>
  )
}
