import { Select } from '@/components/Select'
import { cn } from '@/lib/utils'

/** Uma opção da lista: o que vai no `value` e o que se lê. */
export interface OpcaoDeFiltro {
  id: string
  nome: string
}

/**
 * Um seletor de recorte da barra de filtros.
 *
 * É o `components/Select` vestido de `Chip`: pílula de 28px, e as cores são as de lá, não as do
 * formulário — na barra, o `bg-card` com sombra do `Select` fazia três caixas claras destoarem das
 * pílulas vizinhas. Desligado é a pílula vazada; com filtro escolhido, a preenchida de cinza, como
 * o `Chip` de tom claro.
 *
 * Nativo: teclado, leitor de tela e a roleta do celular vêm prontos, e a lista aberta já é
 * estilizada onde o navegador deixa (`[data-select]`).
 *
 * A opção vazia é o "todos", e é como o filtro se desliga — sem ela, escolher um valor por engano
 * seria irreversível sem recarregar a tela. Ela também é o nome da lista ("Fornecedores"): sem
 * rótulo à vista, é o que diz de que seletor se trata.
 *
 * @param rotulo O que se filtra ("Fornecedor"); nomeia o campo para o leitor de tela.
 * @param todos O que a opção vazia diz — o nome da lista, no plural ("Fornecedores").
 * @param valor Id escolhido, ou `undefined` para todos.
 * @param opcoes O que oferecer, já em ordem.
 * @param aoMudar Recebe o id escolhido, ou `undefined` quando volta para "todos".
 */
export function SeletorDeFiltro({
  rotulo,
  todos,
  valor,
  opcoes,
  aoMudar,
}: {
  rotulo: string
  todos: string
  valor: string | undefined
  opcoes: OpcaoDeFiltro[]
  aoMudar: (id: string | undefined) => void
}) {
  return (
    <Select
      aria-label={rotulo}
      // `w-auto` vence o `w-full` do `Select` (pelo `twMerge`): num grid ou flex ele esticava de
      // ponta a ponta, e o que se quer é a caixa terminando no texto.
      //
      // O teto é em medida, e não `max-w-full`: um `<select>` não quebra linha, então o `min-content`
      // dele é igual ao `max-content` — o `fit-content` não o segura, e a porcentagem se resolve
      // contra o próprio invólucro, que já é do tamanho do conteúdo. 14rem é o teto na barra: razão
      // social comprida é cortada pelo próprio campo, e não empurra o resto da linha.
      className={cn(
        'border-border h-7 w-auto max-w-56 rounded-full text-sm shadow-none md:text-sm',
        // `!` no cinza: o `[data-select]:has(option[value='']:checked)` do CSS base pinta o campo
        // vazio de `--text-muted`, que é a cor de placeholder de formulário — dois tons mais claro
        // que o `Chip` apagado ao lado, e à distância lia-se como "desabilitado".
        valor === undefined
          ? 'text-muted-foreground! bg-transparent'
          : 'bg-border text-foreground border-transparent',
      )}
      value={valor ?? ''}
      onChange={(evento) => aoMudar(evento.target.value || undefined)}
    >
      <option value="">{todos}</option>
      {opcoes.map((opcao) => (
        <option key={opcao.id} value={opcao.id}>
          {opcao.nome}
        </option>
      ))}
    </Select>
  )
}
