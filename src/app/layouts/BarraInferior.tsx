import {
  BadgeCheck,
  CalendarDays,
  Ellipsis,
  House,
  type LucideIcon,
  Megaphone,
  PiggyBank,
  ReceiptText,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useParcelasVencidas, usePendentesDeConferencia } from '@/features/pagamentos'
import { useFormaturaAtiva, usePapel } from '@/hooks/useSessao'
import { cn } from '@/lib/utils'

interface Destino {
  rotulo: string
  para: string
  icone: LucideIcon
  /** Aceso também nas rotas abaixo de `para` — o detalhe de uma parcela, de um aviso. */
  secao?: boolean
  /** O ponto de "tem algo esperando", como o selo do item na barra lateral: o que o leitor de tela ouve. */
  pendente?: string
}

/**
 * A forma de cada destino: ícone em cima, nome embaixo, a largura dividida por igual. O aceso é o
 * laranja da marca como letra (`brand-text`), e não como fundo: cinco pílulas laranja numa faixa de
 * 64px pesariam mais que a tela.
 */
const estiloDoDestino = (ativo: boolean) =>
  cn(
    'focus-visible:ring-ring relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] leading-none focus-visible:ring-2 focus-visible:outline-none [&_svg]:size-[22px]',
    ativo ? 'text-brand-text font-medium' : 'text-muted-foreground hover:text-foreground',
  )

function Ponto({ rotulo }: { rotulo: string }) {
  return (
    <span className="bg-brand border-card absolute top-1.5 left-[calc(50%+6px)] size-2.5 rounded-full border-2">
      <span className="sr-only"> {rotulo}</span>
    </span>
  )
}

/**
 * A barra de baixo do celular (Sprint 41): quatro destinos fixos por papel e o "Mais", que abre a folha
 * com o menu inteiro e a busca.
 *
 * Os destinos (P1): o formando vai a Início, Parcelas, Mural e Agenda; a Gestão, a Início, Conferir,
 * Caixa e Mural — quem é formando e comissão fica com a da comissão, e as parcelas dele moram em
 * "Mais". Conferir é da Tesouraria; a Comissão, que não confere, tem a lista de Parcelas no lugar.
 * Quem foi desligado fica com o que é dele, como na barra lateral.
 *
 * "Mais" acende quando a tela aberta não é nenhum dos quatro: é por ele que se chegou lá.
 *
 * @param aoAbrirMais Abre a folha — ela é da moldura, que também a monta.
 */
export function BarraInferior({ aoAbrirMais }: { aoAbrirMais: () => void }) {
  const { tem } = usePapel()
  const { desligadoEm } = useFormaturaAtiva()
  const { pathname } = useLocation()
  // O mesmo recorte da `BarraLateral`: a claim `papel` sobrevive à saída, a permissão não.
  const ehGestao = !desligadoEm && tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const ehTesouraria = !desligadoEm && tem(PAPEIS.tesoureiro)
  // As mesmas consultas da barra lateral: o React Query as divide, e nenhuma sai duas vezes.
  const { data: parcelasVencidas } = useParcelasVencidas()
  const { data: pendentesDeConferencia } = usePendentesDeConferencia(ehTesouraria)

  const inicio: Destino = { rotulo: 'Início', para: ROTAS.inicio, icone: House }
  const mural: Destino = { rotulo: 'Mural', para: ROTAS.mural, icone: Megaphone, secao: true }
  const minhasParcelas: Destino = {
    rotulo: 'Parcelas',
    para: ROTAS.extrato,
    icone: ReceiptText,
    secao: true,
    pendente: parcelasVencidas ? 'vencidas' : undefined,
  }

  const destinos: Destino[] = desligadoEm
    ? [inicio, minhasParcelas]
    : ehGestao
      ? [
          inicio,
          ehTesouraria
            ? {
                rotulo: 'Conferir',
                para: ROTAS.conferencia,
                icone: BadgeCheck,
                pendente: pendentesDeConferencia ? 'a conferir' : undefined,
              }
            : { rotulo: 'Parcelas', para: ROTAS.parcelas, icone: ReceiptText },
          { rotulo: 'Caixa', para: ROTAS.caixa, icone: PiggyBank },
          mural,
        ]
      : [
          inicio,
          minhasParcelas,
          mural,
          { rotulo: 'Agenda', para: ROTAS.agenda, icone: CalendarDays, secao: true },
        ]

  const naBarra = destinos.some(
    ({ para, secao }) => pathname === para || (secao && pathname.startsWith(`${para}/`)),
  )

  return (
    <nav
      aria-label="Atalhos"
      className="bg-card/95 fixed inset-x-0 bottom-0 z-20 flex h-[calc(4rem+env(safe-area-inset-bottom))] border-t px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {destinos.map(({ rotulo, para, icone: Icone, secao, pendente }) => (
        <NavLink key={para} to={para} end={!secao} className={({ isActive }) => estiloDoDestino(isActive)}>
          <Icone strokeWidth={1.75} aria-hidden />
          {rotulo}
          {pendente ? <Ponto rotulo={pendente} /> : null}
        </NavLink>
      ))}
      <button type="button" onClick={aoAbrirMais} className={estiloDoDestino(!naBarra)}>
        <Ellipsis strokeWidth={1.75} aria-hidden />
        Mais
      </button>
    </nav>
  )
}
