import { useParams } from 'react-router'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LayoutDePaginaPublica } from '@/components/layout/LayoutDePaginaPublica'
import { TextoEmMarkdown } from '@/components/TextoEmMarkdown'
import { DOCUMENTOS, type TipoDeDocumento } from '@/config/legal'
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
  const { documento, carregando, erro, refetch } = useDocumento(tipo, versao)

  return (
    <LayoutDePaginaPublica>
      {carregando ? <EsqueletoDeTexto linhas={12} /> : null}

      {erro ? <ErroDaConsulta erro={erro} aoTentarDeNovo={() => void refetch()} /> : null}

      {documento ? (
        <div className="motion-safe:animate-entrar">
          <TextoEmMarkdown conteudo={documento.conteudo} />
          <p className="text-muted-foreground border-border mt-8 border-t pt-4 text-xs">
            {DOCUMENTOS[tipo].rotulo} · versão {documento.versao} · vigente desde{' '}
            {formatarData(documento.vigente_desde)}
          </p>
        </div>
      ) : null}
    </LayoutDePaginaPublica>
  )
}
