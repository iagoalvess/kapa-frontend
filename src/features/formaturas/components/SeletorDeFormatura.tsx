import { toast } from 'sonner'
import { Select } from '@/components/Select'
import { useFormaturaAtiva } from '@/hooks/useSessao'
import { mensagemDoErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
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
 * "Medicina 2027.1": curso e turma, que é como a pessoa reconhece a própria formatura — o nome é
 * texto livre e carrega o que a comissão quiser. Sem curso ou ano cadastrados, fica o nome.
 */
function rotuloDaTurma(formatura: FormaturaDoUsuario) {
  return formatura.curso && formatura.ano ? `${formatura.curso} ${turma(formatura)}` : formatura.nome
}

// No celular o rótulo trunca: o cabeçalho divide a linha com o título e o avatar.
const LARGURA = 'max-w-[45vw] sm:max-w-80'

/**
 * A formatura da sessão, no cabeçalho ao lado do avatar — e a troca dela, para quem tem mais de uma.
 * O papel do usuário não entra aqui: fica no pé da barra lateral.
 *
 * A troca é o `Select` do sistema: a opção fechada já mostra curso, instituição e turma, o que
 * separa duas turmas de nome parecido. Com uma formatura só, fica o rótulo sem seletor: escolher
 * entre uma opção é ruído. Sem nenhuma selecionada, some — a tela de seleção já está pedindo a
 * escolha.
 */
export function SeletorDeFormatura() {
  const { formaturaId } = useFormaturaAtiva()
  const formaturas = useMinhasFormaturas()
  const selecionar = useSelecionarFormatura()

  const atual = formaturas.data?.find((formatura) => formatura.id === formaturaId)
  if (!formaturas.data || !atual) return null

  if (formaturas.data.length === 1) {
    return (
      <span
        title={descreverTurma(atual)}
        className={cn('text-foreground truncate rounded-md border px-3 py-1.5 text-sm font-medium', LARGURA)}
      >
        {rotuloDaTurma(atual)}
      </span>
    )
  }

  return (
    <Select
      aria-label="Formatura selecionada"
      title={descreverTurma(atual)}
      className={cn('h-8 truncate font-medium', LARGURA)}
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
  )
}
