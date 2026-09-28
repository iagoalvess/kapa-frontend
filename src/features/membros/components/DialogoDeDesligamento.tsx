import { zodResolver } from '@hookform/resolvers/zod'
import { UserMinus } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { AcaoDaLinha } from '@/components/AcoesDaLinha'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { formatarCentavos } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { CampoDeMarcar } from '@/components/CampoDeMarcar'
import { useDesligarMembro, useResumoDaSaida } from '../hooks/useMembros'
import { esquemaDeDesligamento, type FormularioDeDesligamento } from '../schemas/desligamento.schema'
import { MOTIVOS_DE_SAIDA, type MembroDaFormatura, type MotivoDeSaida } from '../types/membros.types'
import { ResumoDaSaida } from './ResumoDaSaida'

/**
 * A saída de um formando, a partir da linha dele na tela de Membros.
 *
 * Os números vêm antes da escolha do motivo (`ResumoDaSaida`): desligar sem vê-los é assinar em
 * branco. A caixa do atraso só aparece quando há atraso — oferecer "cancelar o que está em atraso"
 * a quem não deve nada vencido é convidar a marcar uma opção sem efeito.
 *
 * O aviso sobre a devolução é texto fixo, e não um `if`: é a pergunta que a comissão faz em
 * seguida, e ela precisa da resposta antes de clicar (P2 de 17/09/2026).
 *
 * Quem não aderiu não chega aqui — a linha oferece Remover, e a API recusaria com
 * `formatura.membro_sem_adesao`. A checagem no `disabled` é conveniência de tela; quem recusa é a
 * API.
 *
 * @param membro Quem sairia.
 * @param desabilitado Formatura fora dos status que escrevem.
 */
export function DialogoDeDesligamento({
  membro,
  desabilitado = false,
}: {
  membro: MembroDaFormatura
  desabilitado?: boolean
}) {
  const [aberto, definirAberto] = useState(false)
  const resumo = useResumoDaSaida(membro.usuario_id, aberto)
  const desligar = useDesligarMembro()

  const formulario = useForm<FormularioDeDesligamento>({
    resolver: zodResolver(esquemaDeDesligamento),
    defaultValues: { motivo: 'Trancamento', detalhe: '', cancelar_atraso: false },
  })

  // `useWatch`, e não `watch`: com o React Compiler ligado, a leitura solta do proxy pode não se
  // repetir na re-renderização, e o campo da justificativa nunca apareceria.
  const motivo = useWatch({ control: formulario.control, name: 'motivo' })
  const emAtraso = resumo.data?.parcelas_em_atraso ?? 0
  const nome = membro.nome_completo ?? membro.nome

  const enviar = formulario.handleSubmit((valores) =>
    desligar.mutate(
      {
        usuario_id: membro.usuario_id,
        motivo: valores.motivo,
        detalhe: valores.motivo === 'Outro' ? valores.detalhe : undefined,
        // Sem atraso não há o que cancelar: manda `false` e não o que a caixa escondida guardou.
        cancelar_atraso: emAtraso > 0 && valores.cancelar_atraso,
      },
      {
        onSuccess: () => {
          toast.info(`${nome} foi desligado da turma.`)
          definirAberto(false)
        },
        onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
      },
    ),
  )

  return (
    <>
      <AcaoDaLinha
        rotulo="Desligar"
        icone={UserMinus}
        tom="perigo"
        desabilitada={desabilitado}
        onClick={() => {
          formulario.reset()
          definirAberto(true)
        }}
      />

      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo={`Desligar ${nome} da turma?`}
        descricao="Ele deixa de dever o que ainda não venceu, e para de contar nos números da turma."
      >
        <ResumoDaSaida resumo={resumo.data} />

        <Form {...formulario}>
          <form id={`desligamento-${membro.usuario_id}`} onSubmit={enviar} noValidate className="grid gap-4">
            <FormField
              control={formulario.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da saída</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      onChange={(evento) => field.onChange(evento.target.value as MotivoDeSaida)}
                    >
                      {Object.entries(MOTIVOS_DE_SAIDA).map(([valor, rotulo]) => (
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

            {motivo === 'Outro' ? (
              <FormField
                control={formulario.control}
                name="detalhe"
                render={({ field }) => (
                  <FormItem className="motion-safe:animate-entrar">
                    <FormLabel>Qual?</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Mudou de cidade" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {emAtraso > 0 ? (
              <CampoDeMarcar
                control={formulario.control}
                name="cancelar_atraso"
                className="border-border rounded-xl border p-4"
                rotulo={`Cancelar também o que está em atraso (${formatarCentavos(resumo.data?.em_atraso_em_centavos)})`}
                dica="Sem marcar, o atraso continua devido e ele segue na lista de inadimplentes."
              />
            ) : null}

            <ErroDoFormulario />

            <p className="text-muted-foreground text-sm">
              O que já foi pago continua no caixa da turma. Devolução, se houver, é combinada com ele.
            </p>
          </form>
        </Form>

        <AcoesDoFormulario
          aoCancelar={() => definirAberto(false)}
          ocupado={desligar.isPending}
          desabilitado={resumo.isPending}
          rotulo="Desligar"
          rotuloOcupado="Desligando…"
          form={`desligamento-${membro.usuario_id}`}
        />
      </DialogoDeFormulario>
    </>
  )
}
