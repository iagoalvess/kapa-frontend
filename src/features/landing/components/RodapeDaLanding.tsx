import { Link } from 'react-router'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { ROTAS } from '@/config/rotas'

/**
 * As colunas do rodapé. "Suporte" leva ao formulário: enquanto não houver canal próprio, mandar
 * para um e-mail que ninguém lê é pior que mandar para a caixa que o comercial abre todo dia.
 */
const COLUNAS = [
  {
    titulo: 'Produto',
    links: [
      { rotulo: 'Recursos', href: '#recursos' },
      { rotulo: 'Como funciona', href: '#como-funciona' },
      { rotulo: 'Planos', href: '#planos' },
    ],
  },
  {
    titulo: 'Suporte',
    links: [{ rotulo: 'Perguntas frequentes', href: '#perguntas' }],
  },
] as const

/**
 * O rodapé da página institucional.
 *
 * Os documentos legais são links de verdade (`/termos-de-uso`, `/privacidade`), e não texto:
 * eles são públicos desde a Sprint 1 justamente para serem lidos antes do cadastro.
 *
 * `operadores` entra ao lado dos dois porque responde à mesma pergunta — para onde o dado vai —,
 * e a LGPD (art. 18, VII) não deixa essa resposta depender de ter conta.
 */
export function RodapeDaLanding() {
  return (
    <footer className="border-t px-4 py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid content-start gap-3">
          <LogoKapa className="text-foreground h-9 justify-self-start" />
          <p className="text-muted-foreground text-sm text-pretty">
            Gestão de formatura para a comissão que faz tudo à mão.
          </p>
        </div>

        {COLUNAS.map((coluna) => (
          <nav key={coluna.titulo} aria-label={coluna.titulo} className="grid content-start gap-2">
            <p className="text-foreground font-medium">{coluna.titulo}</p>
            {coluna.links.map((link) => (
              <a
                key={link.rotulo}
                href={link.href}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                {link.rotulo}
              </a>
            ))}
          </nav>
        ))}

        <nav aria-label="Legal" className="grid content-start gap-2">
          <p className="text-foreground font-medium">Legal</p>
          <Link to={ROTAS.termosDeUso} className="text-muted-foreground hover:text-foreground text-sm">
            Termos de Uso
          </Link>
          <Link to={ROTAS.privacidade} className="text-muted-foreground hover:text-foreground text-sm">
            Política de Privacidade
          </Link>
          <Link to={ROTAS.operadores} className="text-muted-foreground hover:text-foreground text-sm">
            Com quem compartilhamos dados
          </Link>
        </nav>
      </div>

      {/*
        A razão social e o CNPJ entram aqui quando existirem (P1 da Sprint 16, em aberto em
        17/09/2026). Enquanto não houver, a linha não inventa um número — rodapé com CNPJ errado é
        pior que rodapé sem CNPJ.
      */}
      <p className="text-texto-muted mx-auto mt-10 w-full max-w-6xl text-sm">
        © {new Date().getFullYear()} Kapa. Todos os direitos reservados.
      </p>
    </footer>
  )
}
