import { Link } from 'react-router'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { env } from '@/config/env'
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
      ...(env.VITE_LISTA_DE_ESPERA ? [] : [{ rotulo: 'Planos', href: '#planos' }]),
    ],
  },
  {
    titulo: 'Suporte',
    links: [{ rotulo: 'Perguntas frequentes', href: '#perguntas' }],
  },
]

/**
 * O rodapé da página institucional.
 *
 * Os documentos legais são links de verdade (`/termos-de-uso`, `/privacidade`), e não texto:
 * eles são públicos desde a Sprint 1 justamente para serem lidos antes do cadastro.
 *
 * `operadores` entra ao lado dos dois porque responde à mesma pergunta — para onde o dado vai —,
 * e a LGPD (art. 18, VII) não deixa essa resposta depender de ter conta.
 *
 * Com a lista de espera (Sprint 36, P11), os três saem: descrevem o sistema, que ninguém usa ainda, e
 * leem o texto da API, que não está no ar. No lugar fica o aviso da lista, o que a LGPD pede na coleta.
 */
export function RodapeDaLanding() {
  return (
    <footer className="border-t px-4 py-10 sm:py-12">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-4">
        <div className="col-span-2 grid content-start gap-3 sm:col-span-1">
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
          {env.VITE_LISTA_DE_ESPERA ? (
            <Link
              to={ROTAS.avisoDaListaDeEspera}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Aviso de privacidade da lista de espera
            </Link>
          ) : (
            <>
              <Link to={ROTAS.termosDeUso} className="text-muted-foreground hover:text-foreground text-sm">
                Termos de Uso
              </Link>
              <Link to={ROTAS.privacidade} className="text-muted-foreground hover:text-foreground text-sm">
                Política de Privacidade
              </Link>
              <Link to={ROTAS.operadores} className="text-muted-foreground hover:text-foreground text-sm">
                Com quem compartilhamos dados
              </Link>
            </>
          )}
        </nav>
      </div>

      {/*
        Quem responde pelo site: os mesmos dados do cabeçalho dos Termos e da Política. Mudou lá —
        versão nova —, muda aqui. O endereço fica só nos documentos: é residencial.
      */}
      <p className="text-texto-muted mx-auto mt-10 w-full max-w-6xl text-sm">
        © {new Date().getFullYear()} Kapa · KAPA FORMATURAS INOVA SIMPLES (I.S.) · CNPJ 69.334.998/0001-67 ·
        contato@kapaformaturas.com.br
      </p>
    </footer>
  )
}
