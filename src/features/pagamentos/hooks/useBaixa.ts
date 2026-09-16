import { baixarManualmente, estornarBaixa } from '../api/pagamentos.api'
import { useEscritaDaConferencia } from './useInformes'

/** A baixa manual, a partir da linha da parcela. Invalida tudo, como a conferência. */
export const useBaixaManual = () => useEscritaDaConferencia(baixarManualmente)

/** O estorno do Presidente. Invalida tudo, como a conferência. */
export const useEstornarBaixa = () => useEscritaDaConferencia(estornarBaixa)
