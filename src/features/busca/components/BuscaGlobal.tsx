import { Loader2, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { detalheDe, GRUPOS, TAMANHO_MINIMO, type BuscaNaTurma } from '../types/busca.types'
import { useBusca } from '../hooks/useBusca'

/** Quanto tempo depois da última tecla a busca vai ao servidor. */
const ATRASO = 250

/**
 * O atalho, no teclado de quem lê: o símbolo no Mac, a tecla por extenso no resto.
 *
 * Miúdo e sem moldura: é uma dica, não um botão. A caixinha com borda que todo mundo desenha aqui
 * pesa mais que o próprio campo num cabeçalho de 36px de altura.
 */
const ATALHO = navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl K'

/** Um painel de busca por tela — o header é único. */
const PAINEL = 'painel-da-busca'

/** Os grupos que vieram com alguma coisa, na ordem de `GRUPOS`. */
const comResultado = (busca: BuscaNaTurma | undefined) =>
  busca ? GRUPOS.filter((grupo) => busca[grupo.chave].length > 0) : []

/**
 * A busca do topo: um campo no header para achar gente, despesa, fornecedor, aviso e documento.
 *
 * Campo à vista, e não uma paleta que abre por cima da tela: o modelo da marca tem a busca no
 * cabeçalho, e quem está numa lista quer digitar ali mesmo, sem a tela sumir atrás de um diálogo.
 * Os resultados caem num balão preso ao campo — `popover` nativo, como o menu da conta e o de
 * exportação: clique fora e Esc fecham sem uma linha de JS, e ele vive na camada de cima, que é o
 * que impede o `<header>` de cortá-lo.
 *
 * No celular o campo é só o ícone e cresce ao receber o foco: um campo de 14rem ao lado do seletor
 * de turma e do avatar não cabe em 430px, e esconder a busca do celular seria tirá-la justamente de
 * quem está com o telefone na mão.
 *
 * Quem decide o que cada papel enxerga é a API: a Comissão não recebe fornecedor, o formando não
 * recebe a lista de membros nem o aviso interno. A tela só desenha o que chegou.
 */
export function BuscaGlobal() {
  const campo = useRef<HTMLInputElement>(null)
  const caixa = useRef<HTMLElement>(null)
  // O balão fecha sozinho no clique fora: o evento `toggle` é como o React fica sabendo disso.
  const estaAberto = useRef(false)
  const [termo, setTermo] = useState('')
  const [atrasado, setAtrasado] = useState('')
  const busca = useBusca(atrasado.trim())

  useEffect(() => {
    const relogio = setTimeout(() => setAtrasado(termo), ATRASO)

    return () => clearTimeout(relogio)
  }, [termo])

  // O atalho leva o foco ao campo, e não abre nada: o painel é consequência do que se digita.
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault()
        campo.current?.focus()
      }
    }

    window.addEventListener('keydown', aoTeclar)

    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  const aberto = termo.trim().length >= TAMANHO_MINIMO

  /**
   * Põe o balão no estado que o termo pede.
   *
   * Chamado também no foco do campo porque o balão fecha sozinho com um clique fora (é o que
   * `popover="auto"` faz, e é o certo): sem isto, voltar ao campo com o termo ainda escrito não
   * traria a lista de volta — para o React nada mudou.
   *
   * O estado vem de `estaAberto`, alimentado pelo evento `toggle` do próprio balão, e não de uma
   * pergunta ao DOM: `showPopover` numa caixa já aberta lança, e é o navegador quem a fecha no
   * clique fora. Sem o método — ambiente que não tem a API —, não há o que sincronizar.
   */
  const sincronizar = () => {
    const painel = document.getElementById(PAINEL)
    if (typeof painel?.showPopover !== 'function') return

    if (aberto && !estaAberto.current) painel.showPopover()
    if (!aberto && estaAberto.current) painel.hidePopover()
  }

  useEffect(sincronizar, [aberto])

  const limpar = () => {
    setTermo('')
    campo.current?.focus()
  }

  /** As setas andam pelos resultados; do campo, a primeira seta para baixo entra na lista. */
  const andar = (evento: React.KeyboardEvent) => {
    if (evento.key === 'Escape') {
      setTermo('')
      return
    }

    if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return

    const itens = [...(caixa.current?.querySelectorAll<HTMLElement>('[data-resultado]') ?? [])]
    if (itens.length === 0) return

    evento.preventDefault()

    const atual = itens.indexOf(document.activeElement as HTMLElement)
    const proximo = evento.key === 'ArrowDown' ? atual + 1 : atual - 1

    itens.at(proximo % itens.length)?.focus()
  }

  const grupos = comResultado(busca.data)

  return (
    // `contents`: quem manda no espaçamento é o header, e uma div a mais no meio viraria um item do
    // `flex` dele — o campo e o balão têm de ser irmãos dos outros itens da barra.
    <search ref={caixa} className="contents">
      {/* `<label>`, e não `<div>`: no celular o campo nasce do tamanho do ícone, e é o rótulo que
          faz o toque em qualquer ponto da pílula cair no `<input>` que ainda não tem largura.
          Cresce só no celular — no computador ele já nasce grande, e um campo que se alarga ao
          receber o foco empurraria o seletor de turma a cada clique. */}
      <label className="border-border bg-card focus-within:ring-ring flex h-9 w-9 items-center gap-2 rounded-full border px-2.5 transition-[width] [anchor-name:--busca] focus-within:ring-2 max-sm:focus-within:w-[min(62vw,20rem)] sm:w-56 sm:px-3 lg:w-64">
        <span className="sr-only">Buscar na turma</span>
        {busca.isFetching ? (
          <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
        )}

        <input
          ref={campo}
          value={termo}
          onChange={(evento) => setTermo(evento.target.value)}
          onFocus={sincronizar}
          onKeyDown={andar}
          placeholder="Buscar na turma"
          aria-controls={PAINEL}
          className="text-foreground placeholder:text-texto-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
        />

        {termo ? (
          <button
            type="button"
            onClick={limpar}
            aria-label="Limpar a busca"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : (
          <kbd className="text-texto-muted hidden shrink-0 font-sans text-[10px] tracking-tight opacity-70 lg:inline">
            {ATALHO}
          </kbd>
        )}
      </label>

      {/* Nenhuma classe de `display` na raiz do popover: o `display:none` que o fecha vem da folha do
          navegador, e qualquer `grid` do autor o venceria — o painel nasceria aberto. */}
      <div
        id={PAINEL}
        popover="auto"
        data-painel=""
        onToggle={(evento) => (estaAberto.current = evento.newState === 'open')}
        className="bg-card shadow-cartao text-foreground w-[min(32rem,92vw)] rounded-2xl border p-2 [position-anchor:--busca]"
      >
        <div className="rolagem-discreta max-h-[60vh] overflow-y-auto">
          {grupos.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              {busca.isFetching || !busca.data ? 'Procurando…' : `Nada encontrado para “${atrasado.trim()}”.`}
            </p>
          ) : null}

          {grupos.map(({ chave, rotulo, icone: Icone, para }) => (
            <section key={chave} className="grid gap-0.5 py-1">
              <h2 className="text-texto-muted px-3 pt-2 pb-1 text-xs">{rotulo}</h2>
              {busca.data?.[chave].map((resultado) => (
                <Link
                  key={resultado.id}
                  to={para(resultado)}
                  data-resultado=""
                  onKeyDown={andar}
                  onClick={() => setTermo('')}
                  className="hover:bg-muted focus-visible:ring-ring flex items-center gap-3 rounded-xl px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Icone className="text-muted-foreground size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-[15px]">{resultado.titulo}</span>
                  {detalheDe(resultado) ? (
                    <span className="text-texto-muted hidden shrink-0 text-xs sm:inline">
                      {detalheDe(resultado)}
                    </span>
                  ) : null}
                </Link>
              ))}
            </section>
          ))}
        </div>
      </div>
    </search>
  )
}
