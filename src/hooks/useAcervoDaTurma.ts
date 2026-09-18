import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/http/cliente'
import { abrirOuBaixar } from '@/lib/download'
import type { Pagina } from '@/types/paginacao'

const DOCUMENTOS = '/api/v1/comunicacao/documentos'

/** O que uma tela precisa para listar e abrir um documento do acervo. Espelha o começo de `DocumentoDTO`. */
export interface ArquivoDoAcervo {
  id: string
  titulo: string
  nome_do_arquivo: string
  content_type: string
}

/**
 * Os documentos que a **turma inteira** enxerga, para escolher o contrato de um item da festa.
 *
 * Mora em `hooks/`, e não em `features/comunicacao`, porque quem escolhe é a feature `festa` — e uma
 * feature não importa de outra. É o mesmo desenho de {@link useDocumentosVigentes}.
 *
 * **O recorte é do servidor** (`visibilidade=Turma`), e não um `filter` sobre a resposta: filtrar
 * depois da paginação descartaria itens já contados na página, e uma turma cujos primeiros 100
 * documentos fossem todos internos veria um seletor vazio com contratos existindo. O parâmetro só
 * estreita o que o papel já podia ver — quem recusa um documento da comissão num cartão público
 * continua sendo a API, com `festa.documento_nao_encontrado`.
 *
 * @param habilitado Falso não consulta. A tela da festa só pede a lista com o formulário aberto.
 */
export function useDocumentosDaTurma(habilitado = true) {
  const consulta = useQuery({
    queryKey: ['acervo', 'da-turma'],
    queryFn: ({ signal }) =>
      api.get<Pagina<ArquivoDoAcervo>>(DOCUMENTOS, {
        query: { tamanho: 100, visibilidade: 'Turma' },
        signal,
      }),
    enabled: habilitado,
  })

  return consulta.data?.itens ?? []
}

/** Tipos que o navegador abre sozinho: vão para uma aba. O resto (Word, Excel) baixa com o nome original. */
const ABRE_NO_NAVEGADOR = /^(application\/pdf|image\/)/

/**
 * Abre um documento do acervo: PDF e imagem numa aba, o resto baixando com o nome original.
 *
 * A aba nasce antes da ida ao servidor: aberta depois dela, o navegador a trataria como pop-up. O
 * endpoint exige o bearer, então o arquivo vem como blob — uma aba aberta por `href` não mandaria o
 * cabeçalho.
 */
export function useAbrirArquivoDoAcervo() {
  const baixar = useMutation({
    mutationFn: (id: string) => api.get<Blob>(`${DOCUMENTOS}/${id}/download`, { resposta: 'blob' }),
  })

  return {
    abrir: (documento: ArquivoDoAcervo) => {
      const aba = ABRE_NO_NAVEGADOR.test(documento.content_type) ? window.open('', '_blank') : null

      baixar.mutate(documento.id, {
        onSuccess: (arquivo) => abrirOuBaixar(arquivo, documento.nome_do_arquivo, aba),
        onError: () => aba?.close(),
      })
    },
    abrindo: baixar.isPending,
  }
}
