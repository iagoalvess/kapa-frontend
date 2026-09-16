import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useGravarConta } from '../hooks/useContaDeRecebimento'
import {
  esquemaDaConta,
  type FormularioDaConta,
  paraFormularioDaConta,
  TIPOS_DE_CHAVE,
} from '../schemas/conta.schema'
import type { ContaDeRecebimento, TipoDeChavePix } from '../types/recebimentos.types'

interface Props {
  /** A conta atual, na troca; ausente, o formulário cadastra a primeira. */
  conta?: ContaDeRecebimento
  /** Depois de trocar ou de desistir da troca. */
  aoConcluir?: () => void
}

/**
 * A chave, o titular e a cidade — o que entra no PIX de cada parcela.
 *
 * Trocar a chave pede confirmação com os dados novos na frente: é o ponto de fraude, e a confirmação
 * diz o que acontece — a comissão inteira recebe e-mail e a chave volta a ficar a conferir. Na
 * primeira chave não há o que confirmar; quem confere é o PIX de teste logo em seguida.
 *
 * Monte com `key` pela conta: os valores iniciais só são lidos na montagem.
 */
export function FormularioDaChave({ conta, aoConcluir }: Props) {
  const gravar = useGravarConta()
  const formulario = useForm<FormularioDaConta>({
    resolver: zodResolver(esquemaDaConta),
    defaultValues: paraFormularioDaConta(conta),
  })
  const tipo = TIPOS_DE_CHAVE[useWatch({ control: formulario.control, name: 'tipo_de_chave' })]
  const [aConfirmar, definirAConfirmar] = useState<FormularioDaConta>()

  const salvar = (valores: FormularioDaConta) =>
    gravar.mutate(valores, {
      onSuccess: () => {
        toast.success(conta ? 'Chave trocada. A comissão foi avisada por e-mail.' : 'Chave cadastrada.')
        aoConcluir?.()
      },
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    })

  const enviar = formulario.handleSubmit((valores) => (conta ? definirAConfirmar(valores) : salvar(valores)))

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="tipo_de_chave"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de chave</FormLabel>
                <FormControl>
                  <Select
                    {...field}
                    onChange={(evento) => {
                      field.onChange(evento.target.value as TipoDeChavePix)
                      // A chave digitada para um tipo quase nunca serve para outro.
                      formulario.setValue('chave', '')
                      formulario.clearErrors('chave')
                    }}
                  >
                    {Object.entries(TIPOS_DE_CHAVE).map(([valor, { rotulo }]) => (
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
            control={formulario.control}
            name="chave"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chave PIX</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    inputMode={tipo.teclado}
                    placeholder={tipo.exemplo}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="nome_do_titular"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do titular</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Como o banco mostra" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="cidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade do titular</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Curitiba" autoComplete="address-level2" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ErroDoFormulario />

        <div className="flex flex-wrap justify-end gap-2">
          {conta && aoConcluir ? (
            <Button type="button" variant="outline" onClick={aoConcluir}>
              Cancelar
            </Button>
          ) : null}
          <Button type="submit" disabled={gravar.isPending}>
            {conta ? 'Trocar chave' : 'Cadastrar chave'}
          </Button>
        </div>
      </form>

      <DialogoDeConfirmacao
        aberto={aConfirmar !== undefined}
        aoFechar={() => definirAConfirmar(undefined)}
        titulo="Trocar a chave PIX da turma?"
        descricao={
          <>
            Os pagamentos passam a ir para a chave{' '}
            {aConfirmar ? TIPOS_DE_CHAVE[aConfirmar.tipo_de_chave].rotulo : ''}{' '}
            <strong className="text-foreground">{aConfirmar?.chave}</strong>, em nome de{' '}
            <strong className="text-foreground">{aConfirmar?.nome_do_titular}</strong>. Todos da comissão
            recebem um e-mail com a chave e o titular novos, e a chave volta a ficar a conferir até um novo
            PIX de teste.
          </>
        }
        rotuloDeCancelar="Revisar"
        rotulo="Trocar chave"
        aoConfirmar={() => aConfirmar && salvar(aConfirmar)}
      />
    </Form>
  )
}
