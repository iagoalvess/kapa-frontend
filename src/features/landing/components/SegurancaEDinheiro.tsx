import { ArrowRight, Landmark, ScrollText, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import mascoteLendoDocumento from '@/assets/mascote/lendo-documento.webp'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { SecaoDaLanding } from './SecaoDaLanding'

const GARANTIAS = [
  {
    icone: Landmark,
    titulo: 'A conta é da turma, não nossa',
    texto:
      'O formando paga direto na chave PIX da comissão. O Kapa monta o QR e registra a baixa — o dinheiro nunca passa por nós, e não há saldo nosso para segurar, reter ou atrasar.',
  },
  {
    icone: ScrollText,
    titulo: 'Trilha de auditoria',
    texto:
      'Baixa manual, estorno, troca da chave PIX e mudança de papel deixam uma linha com autor, data e o que mudou. É o que a assembleia abre quando alguém pergunta.',
  },
  {
    icone: ShieldCheck,
    titulo: 'LGPD levada a sério',
    texto:
      'CPF criptografado no banco e mascarado nas telas, consentimento registrado com versão e data, e o portal do titular para exportar, revogar e pedir eliminação.',
  },
] as const

/**
 * A seção que responde à pergunta que decide a venda: "vocês ficam com o nosso dinheiro?".
 *
 * Não. E é por isso que ela vem antes dos planos — quem chega desconfiado de assessoria de
 * formatura chegou assim por um bom motivo, e nenhuma tabela de preço convence antes dessa
 * resposta (decisão de 14/09/2026, Sprint 8).
 */
export function SegurancaEDinheiro() {
  return (
    <SecaoDaLanding creme className="lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
      <div className="revelar grid justify-items-start gap-5">
        <p className="text-brand-text text-sm font-semibold tracking-wide uppercase">Segurança e dinheiro</p>
        <h2 className="text-foreground text-3xl font-semibold text-balance sm:text-4xl">
          O dinheiro da turma <span className="text-brand-text">não passa pela gente</span>
        </h2>
        <p className="text-muted-foreground text-lg text-pretty">
          O Kapa é software de gestão, não meio de pagamento. Você cobra na conta da própria comissão e nós
          organizamos o resto.
        </p>

        <img src={mascoteLendoDocumento} alt="" className="motion-safe:animate-flutuar w-40 drop-shadow-xl" />

        <Button asChild variant="outline">
          <Link to={ROTAS.privacidade}>
            Ler a Política de Privacidade
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>

      <ul className="grid gap-4">
        {GARANTIAS.map((garantia) => (
          <li
            key={garantia.titulo}
            className="revelar bg-card shadow-cartao flex items-start gap-4 rounded-3xl p-6"
          >
            <span className="bg-brand-tint text-brand-text inline-flex size-11 shrink-0 items-center justify-center rounded-2xl">
              <garantia.icone className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="grid gap-1">
              <h3 className="text-foreground text-lg font-semibold">{garantia.titulo}</h3>
              <p className="text-muted-foreground text-pretty">{garantia.texto}</p>
            </div>
          </li>
        ))}
      </ul>
    </SecaoDaLanding>
  )
}
