import type { EnqueteDetalhe, EnqueteResumo } from '@/types/enquete'

/** Uma consulta de teste com prazo futuro, reutilizada pelas telas que a compartilham. */
export function enqueteDeTeste(dados: Partial<EnqueteResumo> = {}): EnqueteResumo {
  return {
    id: 'e-1',
    pergunta: 'Qual tema você prefere?',
    descricao: null,
    tipo: 'UnicaEscolha',
    maximo_de_escolhas: null,
    quorum_minimo_percentual: 50,
    total_aptos: 10,
    total_respostas: 2,
    quorum_atingido: false,
    situacao: 'Aberta',
    criado_em: '2026-10-11T12:00:00Z',
    encerra_em: '2099-10-12T12:00:00Z',
    encerrada_em: null,
    cancelada_em: null,
    opcoes_travadas: true,
    minha_resposta: null,
    pode_responder: true,
    motivo_do_bloqueio: null,
    ...dados,
  }
}

/** Resultado agregado sem nenhuma escolha de terceiro identificada. */
export function detalheDeTeste(dados: Partial<EnqueteResumo> = {}): EnqueteDetalhe {
  return {
    enquete: enqueteDeTeste(dados),
    opcoes: [
      { id: 'o-1', texto: 'Clássico', ordem: 0, respostas: 2, percentual: 100 },
      { id: 'o-2', texto: 'Tropical', ordem: 1, respostas: 0, percentual: 0 },
    ],
    participantes: null,
  }
}
