import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CamposDoConvidado } from '@/components/CamposDoConvidado'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useEmitirCortesia, useNomearConvidado } from '../hooks/useConvitesDaFesta'
import {
  esquemaDaCortesia,
  type FormularioDaCortesia,
  paraDadosDoConvidado,
  paraFormularioDoConvidado,
} from '../schemas/convidado.schema'
import type { MeuConvite } from '../types/convites.types'

interface Props {
  /**
   * Com um convite, nomeia ou troca o titular dele; com `'cortesia'`, emite um convite da turma
   * (decisão 14); fechado, é `false`.
   */
  aberto: false | { convite: MeuConvite } | 'cortesia'
  /** O evento da cortesia — a portaria aberta; sem ele, a cortesia é da festa. */
  eventoId?: string
  aoFechar: () => void
}

/**
 * Quem vai usar o convite: nome, documento e, se quiser, o e-mail para o convite chegar direto.
 *
 * Um formulário para as duas portas — o formando nomeando o seu e a Gestão dando uma cortesia —,
 * porque o titular é o mesmo nos dois; a cortesia só acrescenta o motivo. Trocar o nome de um
 * convite já nomeado é transferir (decisão 17): o código muda, e o diálogo diz isso antes de salvar.
 */
export function DialogoDoConvidado({ aberto, eventoId, aoFechar }: Props) {
  const cortesia = aberto === 'cortesia'
  const convite = aberto && aberto !== 'cortesia' ? aberto.convite : undefined

  return (
    <DialogoDeFormulario
      aberto={!!aberto}
      aoFechar={aoFechar}
      titulo={
        cortesia ? 'Nova cortesia' : convite?.nome_do_convidado ? 'Editar convidado' : 'Nomear convidado'
      }
      descricao={
        cortesia
          ? 'Convite da turma — paraninfo, patrocinador. Ocupa um lugar como qualquer convite.'
          : convite?.nome_do_convidado
            ? 'Trocar o nome passa o convite para outra pessoa: o código muda e o anterior deixa de valer.'
            : 'O nome e o documento são conferidos na entrada. O documento pode ficar para depois — até o fechamento da lista.'
      }
    >
      <Formulario
        key={convite?.id ?? String(aberto)}
        convite={convite}
        cortesia={cortesia}
        eventoId={eventoId}
        aoConcluir={aoFechar}
      />
    </DialogoDeFormulario>
  )
}

function Formulario({
  convite,
  cortesia,
  eventoId,
  aoConcluir,
}: {
  convite?: MeuConvite
  cortesia: boolean
  eventoId?: string
  aoConcluir: () => void
}) {
  const nomear = useNomearConvidado()
  const emitir = useEmitirCortesia()
  const salvando = nomear.isPending || emitir.isPending

  const formulario = useForm<FormularioDaCortesia>({
    resolver: zodResolver(esquemaDaCortesia),
    defaultValues: { ...paraFormularioDoConvidado(convite), motivo: '' },
  })

  const enviar = formulario.handleSubmit((valores) => {
    const dados = paraDadosDoConvidado(valores)
    const aoErrar = (erro: unknown) => exibirErroNoFormulario(erro, formulario.setError)

    if (cortesia) {
      // Só a cortesia pede motivo; o esquema é um só para os dois, então a obrigatoriedade mora aqui.
      if (!valores.motivo.trim()) {
        formulario.setError('motivo', { message: 'Diga por que a turma está dando este convite.' })
        return
      }

      emitir.mutate(
        { ...dados, motivo: valores.motivo.trim(), evento_id: eventoId },
        {
          onSuccess: () => {
            toast.success('Cortesia emitida.')
            aoConcluir()
          },
          onError: aoErrar,
        },
      )
      return
    }

    if (!convite) return

    nomear.mutate(
      { id: convite.id, dados },
      {
        onSuccess: (salvo) => {
          toast.success(
            salvo.codigo === convite.codigo
              ? 'Convidado salvo.'
              : `Convite transferido. Código novo: ${salvo.codigo}.`,
          )
          aoConcluir()
        },
        onError: aoErrar,
      },
    )
  })

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <CamposDoConvidado documentoAtual={convite?.documento} />

        {cortesia ? (
          <FormField
            control={formulario.control}
            name="motivo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Paraninfo da turma" />
                </FormControl>
                <p className="text-texto-muted text-xs">Fica na auditoria, com o seu nome.</p>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <ErroDoFormulario />

        <AcoesDoFormulario
          aoCancelar={aoConcluir}
          ocupado={salvando}
          rotulo={cortesia ? 'Emitir' : 'Salvar'}
          rotuloOcupado={cortesia ? 'Emitindo…' : 'Salvando…'}
        />
      </form>
    </Form>
  )
}
