import { useFormContext } from 'react-hook-form'
import { Select } from '@/components/Select'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { FormularioDoConvidado } from '@/lib/convidado'
import { ROTULOS_DE_DOCUMENTO } from '@/types/festa'

/**
 * Os campos do titular de um convite: nome, documento e o e-mail para o convite chegar direto.
 *
 * Lê o formulário do contexto (`<Form>`), então serve a qualquer formulário que contenha estes campos —
 * o do formando, a cortesia da Gestão e o do comprador da loja (Sprint 26).
 *
 * @param documentoAtual O documento mascarado do titular atual, quando já há um: em branco o mantém.
 */
export function CamposDoConvidado({ documentoAtual }: { documentoAtual?: string | null }) {
  const { control } = useFormContext<FormularioDoConvidado>()

  return (
    <>
      <FormField
        control={control}
        name="nome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do convidado</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="off" placeholder="Maria Aparecida Silva" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid items-start gap-4 sm:grid-cols-[8rem_1fr]">
        <FormField
          control={control}
          name="tipo_do_documento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Documento</FormLabel>
              <FormControl>
                <Select {...field}>
                  <option value="">—</option>
                  {Object.entries(ROTULOS_DE_DOCUMENTO).map(([valor, rotulo]) => (
                    <option key={valor} value={valor}>
                      {rotulo}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="numero_do_documento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  inputMode="text"
                  autoComplete="off"
                  placeholder={documentoAtual ?? 'Com ou sem pontuação'}
                />
              </FormControl>
              {documentoAtual ? (
                <p className="text-texto-muted text-xs">Em branco mantém o documento atual.</p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail do convidado (opcional)</FormLabel>
            <FormControl>
              <Input type="email" {...field} autoComplete="off" />
            </FormControl>
            <p className="text-texto-muted text-xs">O convite chega direto para ele, com o QR.</p>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
