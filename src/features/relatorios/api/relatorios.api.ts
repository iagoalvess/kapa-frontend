import { api } from '@/lib/http/cliente'
import type {
  Balancete,
  DashboardPublico,
  FiltroDoRelatorio,
  OpcoesDeFiltro,
  PeriodoDoRelatorio,
  Solicitacao,
  TipoDeRelatorio,
} from '../types/relatorios.types'

const DASHBOARD = '/api/v1/dashboard'
const RELATORIOS = '/api/v1/relatorios'

/** O painel de todo membro: caixa, adimplência e no que a turma gastou. */
export function obterDashboardPublico(signal?: AbortSignal) {
  return api.get<DashboardPublico>(`${DASHBOARD}/publico`, { signal })
}

/** O balancete do período, consolidado. */
export function obterBalancete(periodo: PeriodoDoRelatorio, signal?: AbortSignal) {
  return api.get<Balancete>(`${RELATORIOS}/balancete`, { query: { ...periodo }, signal })
}

/**
 * Um relatório em planilha do Excel, montado na hora.
 *
 * Vem como blob porque o endpoint exige o bearer, e uma aba aberta por `href` não o manda — o
 * mesmo motivo do comprovante da despesa. O tipo vai em minúsculas na rota; o enum é
 * case-insensitive na ligação do ASP.NET.
 */
export function exportar(tipo: TipoDeRelatorio, filtro: FiltroDoRelatorio) {
  return api.get<Blob>(`${RELATORIOS}/${tipo.toLowerCase()}.xlsx`, {
    query: { ...filtro },
    resposta: 'blob',
  })
}

/** O que os seletores de filtro oferecem: fornecedores, formandos com parcela e itens de cobrança. */
export function obterOpcoesDeFiltro(signal?: AbortSignal) {
  return api.get<OpcoesDeFiltro>(`${RELATORIOS}/opcoes-de-filtro`, { signal })
}

/**
 * Agenda o PDF de um relatório. Volta na hora; pedido igual já na fila devolve o mesmo.
 *
 * O recorte vai no corpo com os mesmos nomes que a planilha recebe na query string: o worker grava o
 * filtro e refaz o relatório com ele minutos depois, então o que não for enviado aqui não existe
 * para ele.
 */
export function solicitarRelatorio({ tipo, filtro }: { tipo: TipoDeRelatorio; filtro: FiltroDoRelatorio }) {
  return api.post<Solicitacao>(`${RELATORIOS}/solicitacoes`, { body: { tipo, ...filtro } })
}

/** As solicitações da turma, da mais recente. */
export function listarSolicitacoes(signal?: AbortSignal) {
  return api.get<Solicitacao[]>(`${RELATORIOS}/solicitacoes`, { signal })
}

/** O PDF de uma solicitação pronta. Ainda na fila ou já expirada respondem 404. */
export function baixarSolicitacao(id: string) {
  return api.get<Blob>(`${RELATORIOS}/solicitacoes/${id}/arquivo`, { resposta: 'blob' })
}
