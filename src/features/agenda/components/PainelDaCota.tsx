import { zodResolver } from '@hookform/resolvers/zod'
import { Armchair, Ticket, Users } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import type { EventoDoConvite, PainelDaCota as Painel } from '@/types/festa'
import { useAbrirCota, useCota, useDefinirCota } from '../hooks/useCota'
import {
  esquemaDaCota,
  type FormularioDaCota,
  paraDadosDaCota,
  paraFormularioDaCota,
} from '../schemas/cota.schema'

/** Evento da cota: festa ou colação — os dois que têm convite. */
type TipoComCota = EventoDoConvite['tipo']

/** O nome do evento e das pílulas, por tipo. */
const NOMES: Record<TipoComCota, { titulo: string; artigo: string }> = {
  Festa: { titulo: 'Convites da festa', artigo: 'A festa' },
  Colacao: { titulo: 'Convites da colação', artigo: 'A colação' },
}

/**
 * Os convites de um evento, no evento da agenda: quantos cada formando recebe, quantos lugares o
 * local tem, a conta aberta e o botão de abrir.
 *
 * A colação desde a Sprint 30 e a festa desde 01/10/2026. Passar da capacidade avisa e deixa salvar
 * (decisão 3): o número de formandos muda depois, e um bloqueio travaria a comissão num dia em que ela
 * não fez nada de errado. Reabrir não duplica — é como quem entrou na turma depois recebe a cota, se a
 * entrada não tiver emitido.
 *
 * @param tipo A festa ou a colação — o evento cuja cota esta aberta.
 * @param editavel Se a turma aceita escrita. Falso mostra só a conta.
 */
export function PainelDaCota({ tipo, editavel }: { tipo: TipoComCota; editavel: boolean }) {
  const cota = useCota(tipo)
  const abrir = useAbrirCota(tipo)
  const [editando, definirEditando] = useState(false)
  const painel = cota.data
  const nome = NOMES[tipo]

  const abrirCota = () => {
    if (!painel) return

    abrir.mutate(undefined, {
      onSuccess: (novo) => {
        const emitidos = novo.emitidos - painel.emitidos
        toast.success(
          emitidos > 0
            ? `${formatarNumero(emitidos)} convite${emitidos === 1 ? '' : 's'} emitido${emitidos === 1 ? '' : 's'}.`
            : 'Nenhum convite novo: todos os formandos já têm a cota.',
        )
      },
      onError: avisarErro,
    })
  }

  return (
    <section aria-labelledby="titulo-da-cota" className="grid gap-3 border-t pt-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 id="titulo-da-cota" className="font-medium">
            {nome.titulo}
          </h3>
          <p className="text-muted-foreground text-sm">
            Cada formando recebe o mesmo número. Exceção — o paraninfo, a avó que vem de longe — é cortesia na
            portaria.
          </p>
        </div>
        {editavel && painel ? (
          <Button type="button" variant="outline" size="sm" onClick={() => definirEditando(true)}>
            Editar
          </Button>
        ) : null}
      </div>

      {cota.isPending ? <EsqueletoDeTexto linhas={3} /> : null}
      {cota.isError ? <ErroDaConsulta erro={cota.error} aoTentarDeNovo={() => void cota.refetch()} /> : null}

      {painel ? (
        <>
          <Conta painel={painel} />

          {editavel && painel.cota_por_formando !== null ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                size="sm"
                disabled={abrir.isPending || !painel.evento.completo}
                onClick={abrirCota}
              >
                {abrir.isPending ? 'Emitindo…' : painel.aberta_em ? 'Reabrir cota' : 'Abrir cota'}
              </Button>
              <p className="text-muted-foreground text-xs">
                {painel.aberta_em
                  ? 'Emite convites apenas para os formandos que entraram depois. Quem já recebeu mantém a mesma quantidade.'
                  : 'Emite os convites de todos os formandos de uma vez.'}
              </p>
            </div>
          ) : null}

          <DialogoDeFormulario
            aberto={editando}
            aoFechar={() => definirEditando(false)}
            titulo={nome.titulo}
            descricao="Quantos convites cada formando recebe e quantos lugares o local tem."
          >
            <FormularioDaCota tipo={tipo} painel={painel} aoConcluir={() => definirEditando(false)} />
          </DialogoDeFormulario>
        </>
      ) : null}
    </section>
  )
}

function FormularioDaCota({
  tipo,
  painel,
  aoConcluir,
}: {
  tipo: TipoComCota
  painel: Painel
  aoConcluir: () => void
}) {
  const definir = useDefinirCota(tipo)
  const formulario = useForm<FormularioDaCota>({
    resolver: zodResolver(esquemaDaCota),
    defaultValues: paraFormularioDaCota(painel),
  })

  const enviar = formulario.handleSubmit((valores) =>
    definir.mutate(paraDadosDaCota(valores), {
      onSuccess: () => {
        toast.success('Cota salva.')
        aoConcluir()
      },
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    }),
  )

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FormField
            control={formulario.control}
            name="cota_por_formando"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Convites por formando</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="numeric" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={formulario.control}
            name="capacidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lugares no local</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="numeric" placeholder="Não sei" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {painel.aberta_em ? (
          <p className="text-muted-foreground text-sm">
            Os convites já saíram: a cota pode aumentar, mas não diminuir.
          </p>
        ) : null}

        <ErroDoFormulario />
        <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={definir.isPending} />
      </form>
    </Form>
  )
}

/** A conta aberta: quantas cadeiras a turma vai ocupar e, depois de aberta, como está a lista. */
function Conta({ painel }: { painel: Painel }) {
  if (painel.cota_por_formando === null)
    return <p className="text-muted-foreground text-sm">Este evento ainda não tem cota de convites.</p>

  return (
    <div className="grid gap-3 text-sm">
      <ListaDeDados>
        <Dado icone={Ticket} rotulo="Por formando">
          {formatarNumero(painel.cota_por_formando)} convite{painel.cota_por_formando === 1 ? '' : 's'}
        </Dado>
        <Dado icone={Users} rotulo="Lugares ocupados">
          {formatarNumero(painel.formandos_ativos)} formando{painel.formandos_ativos === 1 ? '' : 's'} ×{' '}
          {formatarNumero(painel.cota_por_formando)}
          {painel.cortesias > 0
            ? ` + ${formatarNumero(painel.cortesias)} cortesia${painel.cortesias === 1 ? '' : 's'}`
            : ''}{' '}
          = {formatarNumero(painel.lugares)}
        </Dado>
        <Dado icone={Armchair} rotulo="No local">
          {painel.capacidade === null ? 'Não informado' : `${formatarNumero(painel.capacidade)} lugares`}
        </Dado>
      </ListaDeDados>

      {painel.excedente > 0 ? (
        <p role="alert" className="bg-warning-bg text-warning-text rounded-xl p-3">
          Passa da capacidade em {formatarNumero(painel.excedente)} lugar{painel.excedente === 1 ? '' : 'es'},
          com os {formatarNumero(painel.formandos_ativos)} formandos de hoje. Dá para abrir assim — o número
          muda quando alguém entra ou sai —, mas combine com a instituição antes do evento.
        </p>
      ) : null}

      {painel.aberta_em ? (
        <p className="text-muted-foreground">
          {formatarNumero(painel.emitidos)} emitidos · {formatarNumero(painel.nomeados)} nomeados ·{' '}
          {formatarNumero(painel.sem_nome)} sem nome
        </p>
      ) : null}

      {!painel.evento.completo ? (
        <p className="text-muted-foreground">
          O evento precisa de hora e local na agenda antes de os convites saírem.
        </p>
      ) : null}
    </div>
  )
}
