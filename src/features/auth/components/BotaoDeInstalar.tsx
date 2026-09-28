import { Smartphone } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'

/** O evento do Chrome que permite pedir a instalação depois. Não está no `lib.dom` do TypeScript. */
type EventoDeInstalacao = Event & { prompt: () => Promise<void> }

// O Chrome dispara o evento uma vez, no carregamento, muito antes de alguém abrir o menu — por isso
// a escuta mora no módulo, e não num efeito do componente. O `preventDefault` segura a barrinha de
// instalação que o Chrome mostraria sozinho: o convite é o item do menu, nunca um pop-up na chegada.
let adiado: EventoDeInstalacao | null = null
const ouvintes = new Set<() => void>()

function guardar(evento: EventoDeInstalacao | null) {
  adiado = evento
  for (const ouvinte of ouvintes) ouvinte()
}

globalThis.addEventListener('beforeinstallprompt', (evento) => {
  evento.preventDefault()
  guardar(evento as EventoDeInstalacao)
})
globalThis.addEventListener('appinstalled', () => guardar(null))

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

/** iPhone e iPad — o iPad se apresenta como Mac, e é o toque que o denuncia. */
function ehIos() {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
  )
}

/** `navigator.standalone` só existe no Safari, e é verdadeiro quando a página já abriu pelo ícone. */
function jaInstaladoNoIos() {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

/**
 * "Instalar o app", no menu da conta — e só em celular: no computador nada muda.
 *
 * No Android, guarda o `beforeinstallprompt` e o dispara no clique; o item só existe depois que o
 * navegador sinalizou que dá. No iPhone o Safari não tem esse evento, e fingir um botão que não
 * instala seria pior que explicar: o item abre a instrução do "Adicionar à Tela de Início".
 *
 * @param className O estilo de item do menu em que ele mora.
 */
export function BotaoDeInstalar({ className }: { className?: string }) {
  const evento = useSyncExternalStore(assinar, () => adiado)
  const [comInstrucao, definirComInstrucao] = useState(false)

  if (!globalThis.matchMedia?.('(pointer: coarse)').matches) return null

  if (evento) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          // O evento só vale uma vez: depois do prompt, aceito ou recusado, o item sai.
          guardar(null)
          void evento.prompt()
        }}
      >
        <Smartphone strokeWidth={1.75} aria-hidden />
        Instalar o app
      </button>
    )
  }

  if (!ehIos() || jaInstaladoNoIos()) return null

  return (
    <>
      <button
        type="button"
        aria-expanded={comInstrucao}
        className={className}
        onClick={() => definirComInstrucao(!comInstrucao)}
      >
        <Smartphone strokeWidth={1.75} aria-hidden />
        Instalar o app
      </button>
      {comInstrucao ? (
        <p className="text-muted-foreground px-3 pb-2 text-sm">
          Para abrir o Kapa como aplicativo, toque em <strong>Compartilhar</strong> no Safari e depois em{' '}
          <strong>Adicionar à Tela de Início</strong>.
        </p>
      ) : null}
    </>
  )
}
