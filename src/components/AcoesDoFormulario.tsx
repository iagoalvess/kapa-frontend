import { Button } from '@/components/ui/button'

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
  /** O `id` do `<form>`, quando o rodapé fica fora dele (o rodapé fixo de um diálogo). */
  form?: string
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
  form,
}: Props) {
  return (
    // Duas colunas iguais numa grade do tamanho do conteúdo: os dois botões ficam com a largura do
    // maior ("Cancelar"), sem esticar pelo diálogo.
    <div className="ml-auto grid w-fit grid-cols-2 gap-2">
      <Button type="button" variant="outline" onClick={aoCancelar} disabled={ocupado}>
        Cancelar
      </Button>
      <Button type="submit" form={form} disabled={ocupado || desabilitado}>
        {ocupado ? rotuloOcupado : rotulo}
      </Button>
    </div>
  )
}
