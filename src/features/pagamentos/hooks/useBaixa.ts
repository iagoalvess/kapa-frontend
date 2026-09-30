import { baixarManualmente, cancelarParcela, estornarBaixa } from '../api/pagamentos.api'
import { useEscritaDaConferencia } from './useInformes'

/** A baixa manual, a partir da linha da parcela. Invalida tudo, como a conferência. */
export const useBaixaManual = () => useEscritaDaConferencia(baixarManualmente)

/** O estorno do Presidente. Invalida tudo, como a conferência. */
export const useEstornarBaixa = () => useEscritaDaConferencia(estornarBaixa)

/** O cancelamento avulso da tesouraria (Sprint 42). Invalida tudo: o parcial dela entra na lista "a devolver". */
export const useCancelarParcela = () => useEscritaDaConferencia(cancelarParcela)
