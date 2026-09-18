/** Uma linha da trilha de auditoria. Espelha `LinhaDeAuditoriaDTO`. */
export interface LinhaDeAuditoria {
  id: string
  /** Nome estável do evento, `recurso.acao`. */
  nome: string
  ocorrido_em: string
  /** Nulo em ação de sistema — a régua, o worker. */
  autor_usuario_id: string | null
  autor: string | null
  /** Corpo do evento em JSON, com `antes` e `depois` quando houver. */
  dados: string | null
  /**
   * O nome de cada pessoa citada no corpo, por id.
   *
   * O corpo guarda só o id — a API resolve o nome na leitura, para o titular anonimizado aparecer
   * pelo marcador aqui também. Vazio quando o evento não cita ninguém.
   */
  pessoas: Record<string, string>
}

/** Um autor que aparece na trilha da turma. */
export interface AutorDeAuditoria {
  usuario_id: string
  nome: string
}

/** O que os seletores de filtro da tela oferecem. */
export interface OpcoesDeAuditoria {
  autores: AutorDeAuditoria[]
  nomes: string[]
}

/** O recorte pedido, como ele viaja na query string. */
export interface FiltroDeAuditoria {
  de?: string
  ate?: string
  autor?: string
  nome?: string
  entidade?: string
  /** Nome de pessoa — de quem fez ou de quem sofreu — ou texto escrito no corpo do evento. */
  busca?: string
}

/**
 * Como cada evento auditável aparece na tela.
 *
 * Espelha `NomesDeAuditoria` do backend. Nome que a API devolver e não estiver aqui cai no próprio
 * código — melhor um `cobranca.item_alterado` cru do que uma linha em branco na assembleia.
 */
export const ROTULOS_DE_EVENTO: Record<string, string> = {
  'pagamento.baixado': 'Baixa de parcela',
  'pagamento.estornado': 'Estorno de baixa',
  'recebimento.conta_cadastrada': 'Conta PIX cadastrada',
  'recebimento.conta_alterada': 'Conta PIX alterada',
  'comunicacao.aviso_excluido': 'Aviso excluído',
  'comunicacao.documento_substituido': 'Documento substituído',
  'comunicacao.documento_excluido': 'Documento excluído',
  'membro.papel_alterado': 'Papel alterado',
  'membro.removido': 'Membro removido',
  'formatura.formando_desligado': 'Formando desligado',
  'formatura.formando_religado': 'Desligamento desfeito',
  'cobranca.item_alterado': 'Item de cobrança alterado',
  'cobranca.item_removido': 'Item de cobrança removido',
  'cobranca.item_encerrado': 'Item de cobrança encerrado',
  'cobranca.plano_vigorado': 'Plano em vigor',
  'adesao.termo_publicado': 'Termo publicado',
  'financeiro.despesa_cancelada': 'Despesa cancelada',
  'privacidade.titular_anonimizado': 'Dados de titular anonimizados',
  // A turma vê que quem ativou a licença dela foi o suporte da Kapa, e não o Presidente (Sprint 16).
  // As outras ações do painel são da conta, e não aparecem na trilha de turma nenhuma.
  'suporte.assinatura_ativada': 'Licença ativada pelo suporte',
}

/** O rótulo do evento, ou o próprio código quando ele ainda não tem um. */
export const rotuloDoEvento = (nome: string) => ROTULOS_DE_EVENTO[nome] ?? nome

/** Um item contado da trilha: o rótulo e quantas vezes ele aparece. */
export interface ContagemDaAuditoria {
  rotulo: string
  quantidade: number
}

/**
 * Os números do topo da tela. Espelha `ResumoDaAuditoriaDTO`.
 *
 * Da turma inteira, sem os filtros da tela: a faixa diz como está a trilha, e o recorte filtrado já
 * tem a própria contagem ao lado da busca.
 */
export interface ResumoDaAuditoria {
  total: number
  nos_ultimos_trinta_dias: number
  /** Nulo com a trilha vazia — turma nova não tem última ação. */
  ultima_em: string | null
  ultimo_nome: string | null
  quem_mais_fez: ContagemDaAuditoria | null
  acao_mais_comum: ContagemDaAuditoria | null
}
