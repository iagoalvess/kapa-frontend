import { RodapeDeDialogo } from '@/components/RodapeDeDialogo'
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
  /** O rótulo de desistir. "Cancelar", salvo quando a própria ação é cancelar algo — aí vira "Voltar". */
  rotuloDeCancelar?: string
  /** O `id` do `<form>`, quando o rodapé fica fora dele (o rodapé fixo de um diálogo). */
  form?: string
}

/**
 * O rodapé dos formulários do app: "Cancelar" à esquerda, o principal à direita, os dois da mesma
 * largura e encostados à direita — nunca esticados em metades do diálogo, nem empilhados no celular.
 *
 * É o par de {@link RodapeDeDialogo}: a geometria mora lá, e aqui vive só o que é do formulário — o
 * desistir `type="button"` (dentro do `<form>`, sem isso ele enviaria) e o principal `type="submit"`.
 * Os rótulos usam só um verbo ("Salvar", "Estornar"); o objeto fica no título e na descrição.
 * Do diálogo de documento virou o padrão de todo formulário e dos editores de página.
 */
export function AcoesDoFormulario({
  aoCancelar,
  ocupado = false,
  desabilitado = false,
  rotulo = 'Salvar',
  rotuloOcupado = 'Salvando…',
  rotuloDeCancelar = 'Cancelar',
  form,
}: Props) {
  const classeDoBotao = 'h-auto min-h-11 min-w-0 whitespace-normal'
  return (
    <RodapeDeDialogo variante="duplo">
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
    </RodapeDeDialogo>
  )
}
