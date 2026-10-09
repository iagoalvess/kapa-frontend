import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  /** Desistir: fecha o diálogo ou o editor, sem gravar. */
  aoCancelar: () => void
  /** Enviando: trava os dois botões e troca o rótulo do principal. */
  ocupado?: boolean
  /** Trava só o principal — falta um anexo obrigatório, a turma está fora de `Ativa`. */
  desabilitado?: boolean
  /** O rótulo do principal. "Salvar", salvo onde o verbo é a informação (Adicionar, Publicar, Recusar). */
  rotulo?: string
  /** O rótulo enquanto envia. */
  rotuloOcupado?: string
  /** O rótulo de desistir. "Cancelar", salvo quando a própria ação é cancelar algo — aí vira "Voltar". */
  rotuloDeCancelar?: string
  /** O `id` do `<form>`, quando o rodapé fica fora dele (o rodapé fixo de um diálogo). */
  form?: string
  /** Rótulos longos podem quebrar linha, mantendo as duas ações dentro de um diálogo estreito. */
  rotulosEmMultilinha?: boolean
}

/**
 * O rodapé dos formulários do app: "Cancelar" à esquerda, o principal à direita, os dois da mesma
 * largura e encostados à direita — nunca esticados em metades do diálogo, nem empilhados no celular.
 *
 * É o do diálogo de documento, que virou o padrão de todo diálogo de formulário (fornecedor, despesa,
 * pagamento, baixa, recusa, estorno, senha) e dos editores de página (aviso). Cancelar é `type="button"`:
 * dentro do `<form>`, sem isso, ele enviaria.
 */
export function AcoesDoFormulario({
  aoCancelar,
  ocupado = false,
  desabilitado = false,
  rotulo = 'Salvar',
  rotuloOcupado = 'Salvando…',
  rotuloDeCancelar = 'Cancelar',
  form,
  rotulosEmMultilinha = false,
}: Props) {
  const classeDoBotao = rotulosEmMultilinha ? 'h-auto min-h-11 min-w-0 whitespace-normal px-3' : undefined
  return (
    // A faixa tem a largura toda para cobrir o que rola por baixo quando o diálogo a fixa no pé
    // (`DialogoDeFormulario`). Dentro, duas colunas iguais do tamanho do conteúdo: os dois botões ficam
    // com a largura do maior ("Cancelar"), sem esticar pelo diálogo.
    <div data-slot="acoes-do-formulario" className="flex justify-end">
      <div className={cn('grid w-fit grid-cols-2 gap-2', rotulosEmMultilinha && 'w-full')}>
        <Button
          type="button"
          variant="outline"
          onClick={aoCancelar}
          disabled={ocupado}
          className={classeDoBotao}
        >
          {rotuloDeCancelar}
        </Button>
        <Button type="submit" form={form} disabled={ocupado || desabilitado} className={classeDoBotao}>
          {ocupado ? rotuloOcupado : rotulo}
        </Button>
      </div>
    </div>
  )
}
