import { ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
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

/**
 * A formatura da sessão, no cabeçalho ao lado do avatar — e a troca dela, para quem tem mais de uma.
 * O papel do usuário não entra aqui: fica no pé da barra lateral.
 *
 * O visual é uma pílula com curso e turma; por cima dela fica um `<select>` nativo transparente.
 * O nativo já traz teclado, leitor de tela e a roleta do celular prontos. Um combobox montado à
 * mão precisaria reimplementar os três — e é sempre o terceiro que fica faltando.
 *
 * Com uma formatura só, o bloco fica sem seletor: escolher entre uma opção é ruído. Sem nenhuma
 * selecionada, some — a tela de seleção já está pedindo a escolha.
 */
export function SeletorDeFormatura() {
  const { formaturaId } = useFormaturaAtiva()
  const formaturas = useMinhasFormaturas()
  const selecionar = useSelecionarFormatura()

  const atual = formaturas.data?.find((formatura) => formatura.id === formaturaId)
  if (!formaturas.data || !atual) return null

  const podeTrocar = formaturas.data.length > 1

  return (
    // No celular o rótulo trunca: o cabeçalho divide a linha com o título e o avatar.
    <div
      title={descreverTurma(atual)}
      className={cn(
        'has-focus-visible:ring-ring relative flex h-8 max-w-[45vw] min-w-0 items-center gap-1.5 rounded-lg border px-3 text-sm transition-[background-color,box-shadow] has-focus-visible:ring-2 sm:max-w-80',
        podeTrocar && 'hover:bg-card',
      )}
    >
      <span className="text-foreground truncate font-medium">{rotuloDaTurma(atual)}</span>

      {podeTrocar ? (
        <>
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <select
            aria-label="Formatura selecionada"
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
            value={atual.id}
            disabled={selecionar.isPending}
            onChange={(evento) =>
              selecionar.mutate(evento.target.value, { onError: (erro) => toast.error(mensagemDoErro(erro)) })
            }
          >
            {formaturas.data.map((formatura) => (
              <option key={formatura.id} value={formatura.id}>
                {[formatura.nome, descreverTurma(formatura)].filter(Boolean).join(' — ')}
              </option>
            ))}
          </select>
        </>
      ) : null}
    </div>
  )
}
