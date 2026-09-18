import { Link } from 'react-router'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { ROTAS } from '@/config/rotas'
import { useOperadores } from '../hooks/usePrivacidade'

/**
 * Com quem a Kapa compartilha dado pessoal, e para quê (LGPD, art. 18, VII).
 *
 * **Pública**, e com a mesma casca dos documentos legais: quem ainda está decidindo se cria conta
 * tem direito de saber para onde o dado dele vai, e uma lista atrás do login só é legível por quem
 * já concordou.
 *
 * A lista vem da API — e não está escrita aqui — porque ela precisa bater com a Política de
 * Privacidade, que é versionada no banco. Duas listas editáveis em lugares diferentes discordam no
 * dia em que alguém troca de provedor com pressa.
 */
export default function OperadoresPage() {
  const operadores = useOperadores()

  return (
    <div className="bg-card min-h-full">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-6">
          <Link to={ROTAS.inicio} aria-label="Ir para o início">
            <LogoKapa className="h-7" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-foreground text-2xl font-medium">Com quem compartilhamos seus dados</h1>
        <p className="text-muted-foreground mt-2 text-[15px]">
          Para funcionar, a Kapa usa serviços de terceiros. Eles tratam dado pessoal{' '}
          <strong className="text-foreground font-medium">por conta da Kapa</strong> e só para o que está
          escrito aqui — não podem usá-lo para outra coisa, nem repassá-lo. Os detalhes estão na{' '}
          <Link to={ROTAS.privacidade} className="text-brand-text underline underline-offset-4">
            Política de Privacidade
          </Link>
          .
        </p>

        <p className="text-muted-foreground mt-4 text-[15px]">
          O dinheiro pago pelos formandos <strong className="text-foreground font-medium">não</strong> passa
          pela Kapa: ele vai direto para a chave PIX informada pela comissão da turma.
        </p>

        {operadores.isPending ? <EsqueletoDeTexto linhas={8} className="mt-8" /> : null}

        {operadores.isError ? <ErroDaConsulta erro={operadores.error} className="mt-8" /> : null}

        {operadores.data ? (
          <ul className="motion-safe:animate-entrar mt-8 grid gap-6">
            {operadores.data.map((operador) => (
              <li key={operador.nome} className="border-border grid gap-1 border-b pb-6 last:border-0">
                <h2 className="text-foreground text-lg font-medium">{operador.nome}</h2>
                <p className="text-[15px]">
                  <span className="text-muted-foreground">Para quê: </span>
                  {operador.finalidade}
                </p>
                <p className="text-[15px]">
                  <span className="text-muted-foreground">O que chega até ele: </span>
                  {operador.dados}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  )
}
