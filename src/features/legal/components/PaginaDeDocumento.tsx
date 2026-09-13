import { Link, useParams } from 'react-router'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { DOCUMENTOS, type TipoDeDocumento } from '@/config/legal'
import { ROTAS } from '@/config/rotas'
import { formatarData } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { useDocumento } from '../hooks/useLegal'
import { DocumentoLegal } from './DocumentoLegal'

/**
 * Página pública de um documento legal: a vigente em `/termos-de-uso`, uma versão específica em
 * `/termos-de-uso/2`.
 *
 * Abre sem sessão — é lida antes do cadastro, em nova aba — e cada versão tem endereço
 * permanente, que é o que o registro de aceite aponta.
 *
 * @param tipo Documento exibido.
 */
export function PaginaDeDocumento({ tipo }: { tipo: TipoDeDocumento }) {
  const { versao } = useParams()
  const { documento, carregando, erro } = useDocumento(tipo, versao)

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
        {carregando ? <p className="text-muted-foreground text-sm">Carregando…</p> : null}

        {erro ? (
          <p role="alert" className="text-destructive text-sm">
            {mensagemDoErro(erro)}
          </p>
        ) : null}

        {documento ? (
          <div className="motion-safe:animate-entrar">
            <p className="text-muted-foreground mb-6 text-xs">
              {DOCUMENTOS[tipo].rotulo} · versão {documento.versao} · vigente desde{' '}
              {formatarData(documento.vigenteDesde)}
            </p>
            <DocumentoLegal conteudo={documento.conteudo} />
          </div>
        ) : null}
      </main>
    </div>
  )
}
