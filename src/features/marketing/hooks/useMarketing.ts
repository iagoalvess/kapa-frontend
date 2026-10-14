import { useMutation } from '@tanstack/react-query'
import { descadastrar } from '../api/marketing.api'

export function useDescadastrar() {
  return useMutation({ mutationFn: descadastrar })
}
