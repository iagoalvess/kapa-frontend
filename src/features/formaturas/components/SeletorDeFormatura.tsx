import { toast } from 'sonner'
import { useFormaturaAtiva } from '@/hooks/useSessao'
import { mensagemDoErro } from '@/lib/http/erros'
import { useMinhasFormaturas, useSelecionarFormatura } from '../hooks/useFormaturas'

/**
 * Troca a formatura da sessão a partir do cabeçalho.
 *
 * É um `<select>` nativo de propósito: ele já traz teclado, leitor de tela e a roleta do celular
 * prontos. Um combobox montado à mão precisaria reimplementar os três — e é sempre o terceiro
 * que fica faltando.
 *
 * Some quando o usuário só tem uma formatura: um seletor de uma opção só é ruído.
 */
export function SeletorDeFormatura() {
  const { formaturaId } = useFormaturaAtiva()
  const formaturas = useMinhasFormaturas()
  const selecionar = useSelecionarFormatura()

  if (!formaturas.data || formaturas.data.length < 2) return null

  return (
    <select
      aria-label="Formatura selecionada"
      className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
      value={formaturaId ?? ''}
      disabled={selecionar.isPending}
      onChange={(evento) =>
        selecionar.mutate(evento.target.value, { onError: (erro) => toast.error(mensagemDoErro(erro)) })
      }
    >
      {formaturaId === null ? <option value="">Escolha a formatura…</option> : null}

      {formaturas.data.map((formatura) => (
        <option key={formatura.id} value={formatura.id}>
          {formatura.nome}
        </option>
      ))}
    </select>
  )
}
