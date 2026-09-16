import type { Control, FieldValues, Path } from 'react-hook-form'
import { Select } from '@/components/Select'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ROTULOS_DE_VISIBILIDADE, type Visibilidade } from '../types/comunicacao.types'

/** O que cada escolha significa, dito embaixo do combo — quem publica precisa ler antes de enviar. */
const DICAS: Record<Visibilidade | '', string> = {
  '': 'Escolha se toda a turma lê ou só a comissão.',
  Turma: 'Todo membro vê, o formando inclusive.',
  SomenteComissao: 'Só Presidente, Tesouraria e Comissão veem. O formando não recebe nem pela API.',
}

/**
 * Para quem é o aviso ou o documento — o campo que separa a ata interna do comunicado público
 * (decisão 4 da Sprint 11). Serve aos dois formulários, e por isso recebe o `control` e o nome.
 *
 * Começa em "Escolha": sem padrão, esquecer de marcar vira erro de formulário, e não um documento
 * interno publicado para a turma.
 */
export function SeletorDeVisibilidade<T extends FieldValues>({
  control,
  name,
  desabilitado,
}: {
  control: Control<T>
  name: Path<T>
  desabilitado?: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Para quem é</FormLabel>
          <FormControl>
            <Select {...field} disabled={desabilitado}>
              <option value="">Escolha</option>
              {Object.entries(ROTULOS_DE_VISIBILIDADE).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </Select>
          </FormControl>
          <p className="text-texto-muted text-xs">{DICAS[field.value as Visibilidade | ''] ?? DICAS['']}</p>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
