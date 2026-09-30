import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/http/cliente'
import { abrirEmNovaAba } from '@/lib/download'
import type { Pagina } from '@/types/paginacao'
import { MODULOS } from '@/config/planos'
import { usePlanoDaTurma } from './usePlanoDaTurma'

const DOCUMENTOS = '/api/v1/comunicacao/documentos'

/** O que uma tela precisa para listar e abrir um documento do acervo. Espelha o começo de `DocumentoDTO`. */
interface ArquivoDoAcervo {
  id: string
  titulo: string
  nome_do_arquivo: string
  content_type: string
}

/**
 * Os documentos que a **turma inteira** enxerga, para escolher o contrato de um item da festa ou o
 * comprovante de uma receita (Sprint 28).
 *
 * Mora em `hooks/`, e não em `features/comunicacao`, porque quem escolhe são as features `festa` e
 * `financeiro` — e uma feature não importa de outra. É o mesmo desenho de {@link useDocumentosVigentes}.
 *
 * **O recorte é do servidor** (`visibilidade=Turma`), e não um `filter` sobre a resposta: filtrar
 * depois da paginação descartaria itens já contados na página, e uma turma cujos primeiros 100
 * documentos fossem todos internos veria um seletor vazio com contratos existindo. O parâmetro só
 * estreita o que o papel já podia ver — quem recusa um documento da comissão num cartão público
 * continua sendo a API, com `festa.documento_nao_encontrado` ou `financeiro.documento_nao_encontrado`.
 *
 * @param habilitado Falso não consulta. As telas só pedem a lista com o formulário aberto.
 */
export function useDocumentosDaTurma(habilitado = true) {
  const { inclui } = usePlanoDaTurma()

  const consulta = useQuery({
    queryKey: ['comunicacao', 'documentos', 'da-turma'],
    queryFn: ({ signal }) =>
      api.get<Pagina<ArquivoDoAcervo>>(DOCUMENTOS, {
        query: { tamanho: 100, visibilidade: 'Turma' },
        signal,
      }),
    // O acervo é do módulo `mural`: fora do plano, o seletor fica vazio sem pedir nada (Sprint 45).
    enabled: habilitado && inclui(MODULOS.mural),
  })

  return consulta.data?.itens ?? []
}

/**
 * Abre um documento do acervo: PDF e imagem numa aba — sem visualizador embutido, o navegador já tem
 * um —, o resto baixando com o nome original.
 *
 * A API confere formatura e visibilidade e responde 302 para uma URL assinada de minutos; o `fetch`
 * segue o redirecionamento sozinho. O endpoint exige o bearer, então o arquivo vem como blob — uma
 * aba aberta por `href` não mandaria o cabeçalho.
 */
export function useAbrirArquivoDoAcervo() {
  const baixar = useMutation({
    mutationFn: (id: string) => api.get<Blob>(`${DOCUMENTOS}/${id}/download`, { resposta: 'blob' }),
  })

  return {
    abrir: (documento: ArquivoDoAcervo) =>
      abrirEmNovaAba(baixar, documento.id, {
        nome: documento.nome_do_arquivo,
        contentType: documento.content_type,
      }),
    abrindo: baixar.isPending,
  }
}
