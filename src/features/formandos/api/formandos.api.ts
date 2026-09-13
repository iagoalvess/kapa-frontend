import { api } from '@/lib/http/cliente'
import type { Pagina } from '@/types/paginacao'
import type {
  AtualizarPerfil,
  FiltroDeFormandos,
  FormandoResumo,
  PerfilDoFormando,
} from '../types/formandos.types'

export { consultarCep } from '@/lib/http/cep'

const BASE = '/api/v1/formandos'

// `eu`, e não o id: quem é "eu" a API tira do token — não há id no caminho para alguém trocar.

/** O próprio cadastro, vazio se ainda não foi preenchido. */
export function obterMeuPerfil(signal?: AbortSignal) {
  return api.get<PerfilDoFormando>(`${BASE}/eu`, { signal })
}

/** Grava as seções enviadas do próprio cadastro. */
export function atualizarMeuPerfil(dados: AtualizarPerfil) {
  return api.put<PerfilDoFormando>(`${BASE}/eu`, { body: dados })
}

/** Troca a própria foto. A API confere o tipo pelos bytes e redimensiona. */
export function enviarFoto(arquivo: File) {
  const corpo = new FormData()
  corpo.append('foto', arquivo)

  return api.post<PerfilDoFormando>(`${BASE}/eu/foto`, { body: corpo, tempoLimite: 60_000 })
}

/**
 * A foto como `data:` URL, pronta para o `<img>`.
 *
 * O `<img src>` apontando para a API não levaria o token, que vive em memória. `data:` em vez de
 * `URL.createObjectURL` porque não precisa ser revogada — o cache do React Query descarta sozinho.
 *
 * @param origem O próprio baixa pelo módulo de arquivos (é o dono); a comissão, pela rota do
 * formando, que confere a Gestão e a turma.
 */
export async function baixarFoto(
  origem: { arquivoId: string } | { usuarioId: string },
  signal?: AbortSignal,
) {
  const caminho =
    'usuarioId' in origem
      ? `${BASE}/${origem.usuarioId}/foto`
      : `/api/v1/arquivos/${origem.arquivoId}/conteudo`
  const blob = await api.get<Blob>(caminho, { resposta: 'blob', signal })

  // Em fatias: `fromCharCode(...bytes)` de uma vez estoura a pilha com 100 kB.
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binario = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }

  return `data:${blob.type || 'image/jpeg'};base64,${btoa(binario)}`
}

/** Uma página dos membros ativos com a completude do cadastro. Gestão. */
export function listarFormandos(filtro: FiltroDeFormandos, signal?: AbortSignal) {
  return api.get<Pagina<FormandoResumo>>(BASE, {
    query: { pagina: filtro.pagina, tamanho: filtro.tamanho, busca: filtro.busca, situacao: filtro.situacao },
    signal,
  })
}

/** O cadastro de um formando da turma. Gestão. */
export function obterFormando(usuarioId: string, signal?: AbortSignal) {
  return api.get<PerfilDoFormando>(`${BASE}/${usuarioId}`, { signal })
}

/** Correção do cadastro de um formando, registrada com o autor. Só o Presidente. */
export function corrigirPerfil(usuarioId: string, dados: AtualizarPerfil) {
  return api.put<PerfilDoFormando>(`${BASE}/${usuarioId}`, { body: dados })
}
