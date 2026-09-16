import { Link, useParams } from 'react-router'
import mascoteLendo from '@/assets/mascote/lendo-documento.webp'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { TextoEmMarkdown } from '@/components/TextoEmMarkdown'
import { DOCUMENTOS, type TipoDeDocumento } from '@/config/legal'
import { ROTAS } from '@/config/rotas'
import { formatarData } from '@/lib/formato'
import { useDocumento } from '../hooks/useLegal'

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
        {carregando ? <EsqueletoDeTexto linhas={12} /> : null}

        {erro ? <ErroDaConsulta erro={erro} /> : null}

        {documento ? (
          <div className="motion-safe:animate-entrar">
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-muted-foreground text-xs">
                {DOCUMENTOS[tipo].rotulo} · versão {documento.versao} · vigente desde{' '}
                {formatarData(documento.vigente_desde)}
              </p>
              <img src={mascoteLendo} alt="" className="w-20 shrink-0 drop-shadow-md" />
            </div>
            <TextoEmMarkdown conteudo={documento.conteudo} />
          </div>
        ) : null}
      </main>
    </div>
  )
}
