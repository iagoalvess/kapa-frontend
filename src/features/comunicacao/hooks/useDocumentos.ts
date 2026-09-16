import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { abrirOuBaixar } from '@/lib/download'
import { mensagemDoErro } from '@/lib/http/erros'
import {
  atualizarDocumento,
  baixarDocumento,
  enviarDocumento,
  excluirDocumento,
  listarDocumentos,
  resumirAcervo,
} from '../api/comunicacao.api'
import {
  type Documento,
  type FiltroDeDocumentos,
  type TipoDeArquivo,
  tipoDoArquivo,
  type Visibilidade,
} from '../types/comunicacao.types'
import { chaves } from './chaves'

/** Uma página do acervo. A anterior fica na tela enquanto a próxima chega. */
export function useDocumentos(filtro: FiltroDeDocumentos) {
  return useQuery({
    queryKey: chaves.documentos(filtro),
    queryFn: ({ signal }) => listarDocumentos(filtro, signal),
    placeholderData: (anterior) => anterior,
  })
}

/** O acervo em números — a faixa do topo e a contagem de cada pílula de categoria. */
export function useResumoDoAcervo() {
  return useQuery({
    queryKey: chaves.resumoDoAcervo,
    queryFn: ({ signal }) => resumirAcervo(signal),
  })
}

/** Toda escrita do acervo derruba a lista e o resumo (o prefixo cobre os dois). */
function useEscritaDoAcervo<T, R>(escrever: (variaveis: T) => Promise<R>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: escrever,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chaves.todosOsDocumentos })
    },
  })
}

export const useEnviarDocumento = () => useEscritaDoAcervo(enviarDocumento)
export const useAtualizarDocumento = () => useEscritaDoAcervo(atualizarDocumento)
export const useExcluirDocumento = () => useEscritaDoAcervo(excluirDocumento)

/** O arquivo de um documento, pela URL assinada. Mutação: é ação do clique, não dado de tela. */
export function useBaixarDocumento() {
  return useMutation({ mutationFn: baixarDocumento })
}

/** Tipos que o navegador abre sozinho: vão para uma aba. O resto (Word, Excel) baixa com o nome original. */
const ABRE_NO_NAVEGADOR = /^(application\/pdf|image\/)/

/**
 * Abre um documento: PDF e imagem numa aba — sem visualizador embutido, o navegador já tem um —, Word
 * e Excel baixando com o nome original.
 *
 * A aba nasce antes da ida ao servidor: aberta depois dela, o navegador a trataria como pop-up.
 */
export function useAbrirDocumento() {
  const baixar = useBaixarDocumento()

  const abrir = (documento: Documento) => {
    const aba = ABRE_NO_NAVEGADOR.test(documento.content_type) ? window.open('', '_blank') : null
    baixar.mutate(documento.id, {
      onSuccess: (arquivo) => abrirOuBaixar(arquivo, documento.nome_do_arquivo, aba),
      onError: (erro) => {
        aba?.close()
        toast.error(mensagemDoErro(erro))
      },
    })
  }

  return { abrir, abrindo: baixar.isPending }
}

/** Os filtros do quadro que não vão à API: vivem na URL e se aplicam ao acervo já carregado. */
export interface FiltroDoQuadro {
  visibilidade?: Visibilidade
  tipo?: TipoDeArquivo
  /** Só os adicionados nos últimos 30 dias. */
  recentes?: boolean
}

const TRINTA_DIAS = 30 * 86_400_000

/**
 * Aplica os filtros do quadro ao acervo carregado.
 *
 * ponytail: filtro no navegador, sobre a página inteira (o teto de 100 do servidor): o acervo de uma
 * turma são dezenas de arquivos, e as contagens das pílulas saem da mesma lista sem outra ida à API.
 * Com acervo acima de 100, estes filtros vão para `FiltroDeDocumentos` e as contagens para o resumo.
 *
 * @param documentos O acervo carregado.
 * @param filtro Visibilidade, tipo e período.
 * @param agora Referência dos 30 dias; o padrão é agora.
 */
export function filtrarDocumentos(documentos: Documento[], filtro: FiltroDoQuadro, agora = Date.now()) {
  return documentos.filter(
    (documento) =>
      (!filtro.visibilidade || documento.visibilidade === filtro.visibilidade) &&
      (!filtro.tipo || tipoDoArquivo(documento.content_type) === filtro.tipo) &&
      (!filtro.recentes || agora - Date.parse(documento.enviado_em) <= TRINTA_DIAS),
  )
}
