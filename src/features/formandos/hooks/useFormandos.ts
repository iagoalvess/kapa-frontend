import { useQuery } from '@tanstack/react-query'
import { obterFormando } from '../api/formandos.api'
import { chaves } from './chaves'

/** O cadastro de um formando da turma. */
export function useFormando(usuario_id: string) {
  return useQuery({
    queryKey: chaves.detalhe(usuario_id),
    queryFn: ({ signal }) => obterFormando(usuario_id, signal),
  })
}
