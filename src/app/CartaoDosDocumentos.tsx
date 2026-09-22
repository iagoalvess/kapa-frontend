import { FolderOpen } from 'lucide-react'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { LinkDoCartao } from '@/components/LinkDoCartao'
import { ROTAS } from '@/config/rotas'
import { CartaoDeDocumento } from '@/features/comunicacao/components/QuadroDeDocumentos'
import { useDocumentos } from '@/features/comunicacao/hooks/useDocumentos'
import { formatarNumero } from '@/lib/formato'

/** Uma amostra do acervo, com os mesmos cartões e permissões da página de documentos. */
export function CartaoDosDocumentos() {
  const documentos = useDocumentos({ pagina: 1, tamanho: 2, ordenar_por: 'enviadoEm', descendente: true })
  const acervo = documentos.data

  return (
    <Cartao
      titulo="Documentos da turma"
      descricao="Tudo guardado, tudo combinado."
      icone={FolderOpen}
      className="[&>header]:flex-nowrap [&>header>div]:basis-auto"
      acao={<LinkDoCartao to={ROTAS.documentos} rotulo="Ver todos os documentos" />}
    >
      {documentos.isPending ? <EsqueletoDeTexto linhas={5} /> : null}
      {documentos.isError ? <ErroDaConsulta erro={documentos.error} /> : null}
      {acervo ? (
        <div className="bg-muted grid gap-3 rounded-3xl p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-0.5">
            <h3 className="text-sm font-medium">Últimos adicionados</h3>
            <span className="bg-border text-muted-foreground rounded-full px-2 py-1 text-xs">
              {formatarNumero(acervo.total)}{' '}
              {acervo.total === 1 ? 'documento no acervo' : 'documentos no acervo'}
            </span>
          </div>
          {acervo.itens.length ? (
            <ul className="grid gap-3">
              {acervo.itens.map((documento) => (
                <li key={documento.id}>
                  <CartaoDeDocumento documento={documento} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid justify-items-center gap-3 px-4 py-6 text-center">
              <FolderOpen className="text-texto-muted size-9" strokeWidth={1.25} aria-hidden />
              <p className="text-sm font-medium">O acervo está começando.</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Atas, contratos e combinados ficam reunidos aqui quando a comissão adicionar os primeiros
                documentos.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </Cartao>
  )
}
