import type { Control, FieldValues, Path } from 'react-hook-form'
import { RotuloComInfo } from '@/components/InfoDoCampo'
import { Select } from '@/components/Select'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const DIAS = Array.from({ length: 31 }, (_, indice) => String(indice + 1))

/** O que um formulário precisa ter para receber os campos da grade. */
interface ValoresDaGrade extends FieldValues {
  numero_de_parcelas: string
  dia_de_vencimento: string
}

/**
 * Parcelas e dia de vencimento — os dois campos que desenham a grade de um item, o do plano e o
 * opcional.
 *
 * Travam juntos: depois que o item gerou parcela, mudar qualquer um dos dois redesenharia parcelas
 * que já existem, e a API recusa com `cobranca.item_em_uso`.
 *
 * @param control O `control` do formulário.
 * @param rotuloDasParcelas "Parcelas" no plano; "Parcelas até" no opcional, em que o formando escolhe.
 * @param travado Falso deixa editar.
 */
export function CamposDaGrade<T extends ValoresDaGrade>({
  control,
  rotuloDasParcelas,
  travado,
}: {
  control: Control<T>
  rotuloDasParcelas: string
  travado: boolean
}) {
  return (
    <>
      <FormField
        control={control}
        name={'numero_de_parcelas' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{rotuloDasParcelas}</FormLabel>
            <FormControl>
              <Input {...field} type="number" inputMode="numeric" min={1} max={120} disabled={travado} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={'dia_de_vencimento' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <RotuloComInfo info="Nos meses mais curtos, os dias 29, 30 e 31 caem no último dia do mês.">
              Vence todo dia
            </RotuloComInfo>
            <FormControl>
              <Select {...field} disabled={travado}>
                {DIAS.map((dia) => (
                  <option key={dia} value={dia}>
                    {dia}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
