import { zodResolver } from '@hookform/resolvers/zod'
import { Armchair, Lock, Ticket, Users } from 'lucide-react'
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
import type { EventoDoConvite, PainelDeConvites as Painel } from '@/types/festa'
import {
  useDefinirCapacidade,
  useLiberarConvitesPresos,
  usePainelDeConvites,
} from '../hooks/usePainelDeConvites'
import { esquemaDaCapacidade, type FormularioDaCapacidade } from '../schemas/painelDeConvites.schema'

/** Evento com convite: festa ou colação. */
type TipoComConvite = EventoDoConvite['tipo']

const TITULOS: Record<TipoComConvite, string> = { Festa: 'Convites da festa', Colacao: 'Convites da colação' }

const plural = (quantos: number, singular: string, varios: string) =>
  `${formatarNumero(quantos)} ${quantos === 1 ? singular : varios}`

/**
 * Os convites de um evento, no evento da agenda (Sprint 47): quantos os pacotes das cestas concedem, quantos
 * lugares o local tem e quem está com convite preso por atraso.
 *
 * Sucessor do painel da cota (Sprint 30): o número por formando saiu — cada um tem o da cesta dele — e o botão de
 * abrir também. Os convites saem sozinhos, na adesão e quando o evento ganha hora e local na agenda. Passar da
 * capacidade avisa e deixa salvar (Sprint 30, decisão 3).
 *
 * @param tipo A festa ou a colação.
 * @param editavel Se a turma aceita escrita. Falso mostra só a conta.
 */
export function PainelDeConvites({ tipo, editavel }: { tipo: TipoComConvite; editavel: boolean }) {
  const consulta = usePainelDeConvites(tipo)
  const [editando, definirEditando] = useState(false)
  const painel = consulta.data

  return (
    <section aria-labelledby="titulo-dos-convites" className="grid gap-3 border-t pt-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 id="titulo-dos-convites" className="font-medium">
            {TITULOS[tipo]}
          </h3>
          <p className="text-muted-foreground text-sm">
            Cada formando recebe os convites dos pacotes que contratou. Exceção — o paraninfo, a avó que vem
            de longe — é cortesia na portaria.
          </p>
        </div>
        {editavel && painel ? (
          <Button type="button" variant="outline" size="sm" onClick={() => definirEditando(true)}>
            Capacidade
          </Button>
        ) : null}
      </div>

      {consulta.isPending ? <EsqueletoDeTexto linhas={3} /> : null}
      {consulta.isError ? (
        <ErroDaConsulta erro={consulta.error} compacto aoTentarDeNovo={() => void consulta.refetch()} />
      ) : null}

      {painel ? (
        <>
          <Conta painel={painel} />
          <Presos painel={painel} editavel={editavel} />

          <DialogoDeFormulario
            aberto={editando}
            aoFechar={() => definirEditando(false)}
            titulo={TITULOS[tipo]}
            descricao="Quantos lugares o local tem. Passar deles avisa, mas não bloqueia."
          >
            <FormularioDaCapacidade tipo={tipo} painel={painel} aoConcluir={() => definirEditando(false)} />
          </DialogoDeFormulario>
        </>
      ) : null}
    </section>
  )
}

function FormularioDaCapacidade({
  tipo,
  painel,
  aoConcluir,
}: {
  tipo: TipoComConvite
  painel: Painel
  aoConcluir: () => void
}) {
  const definir = useDefinirCapacidade(tipo)
  const formulario = useForm<FormularioDaCapacidade>({
    resolver: zodResolver(esquemaDaCapacidade),
    defaultValues: { capacidade: painel.capacidade === null ? '' : String(painel.capacidade) },
  })

  const enviar = formulario.handleSubmit((valores) =>
    definir.mutate(valores.capacidade === '' ? null : Number(valores.capacidade), {
      onSuccess: () => {
        toast.success('Capacidade salva.')
        aoConcluir()
      },
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    }),
  )

  return (
    <Form {...formulario}>
      <form onSubmit={enviar} noValidate className="grid gap-4">
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
        <ErroDoFormulario />
        <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={definir.isPending} />
      </form>
    </Form>
  )
}

/** A conta aberta: quantas cadeiras a turma vai ocupar e como está a lista. */
function Conta({ painel }: { painel: Painel }) {
  return (
    <div className="grid gap-3 text-sm">
      <ListaDeDados>
        <Dado icone={Ticket} rotulo="Dos pacotes">
          {plural(painel.beneficios, 'convite', 'convites')} para{' '}
          {plural(painel.formandos_ativos, 'formando', 'formandos')}
        </Dado>
        <Dado icone={Users} rotulo="Lugares ocupados">
          {formatarNumero(painel.beneficios)}
          {painel.extras > 0 ? ` + ${plural(painel.extras, 'extra', 'extras')}` : ''}
          {painel.cortesias > 0 ? ` + ${plural(painel.cortesias, 'cortesia', 'cortesias')}` : ''} ={' '}
          {formatarNumero(painel.lugares)}
        </Dado>
        <Dado icone={Armchair} rotulo="No local">
          {painel.capacidade === null ? 'Não informado' : `${formatarNumero(painel.capacidade)} lugares`}
        </Dado>
      </ListaDeDados>

      {painel.excedente > 0 ? (
        <p role="alert" className="bg-warning-bg text-warning-text rounded-xl p-3">
          Passa da capacidade em {plural(painel.excedente, 'lugar', 'lugares')}. Combine com o local antes do
          evento — a cesta de cada formando é contrato e não diminui sozinha.
        </p>
      ) : null}

      <p className="text-muted-foreground">
        {formatarNumero(painel.emitidos)} emitidos · {formatarNumero(painel.nomeados)} nomeados ·{' '}
        {formatarNumero(painel.sem_nome)} sem nome
      </p>

      {!painel.evento.completo ? (
        <p className="text-muted-foreground">
          O evento precisa de hora e local na agenda antes de os convites saírem.
        </p>
      ) : null}
    </div>
  )
}

/**
 * Quem tem convite preso por parcela em atraso (D24): ele não entra na portaria até regularizar — ou até a comissão
 * liberar, que é o botão daqui. Liberar vale para os convites dele em todos os eventos.
 */
function Presos({ painel, editavel }: { painel: Painel; editavel: boolean }) {
  const liberar = useLiberarConvitesPresos()

  if (painel.presos.length === 0) return null

  return (
    <div className="grid gap-2 text-sm">
      <p className="text-foreground flex items-center gap-2 font-medium">
        <Lock className="size-4" aria-hidden />
        Presos por parcela em atraso
      </p>
      <ul className="grid gap-2">
        {painel.presos.map((preso) => (
          <li key={preso.vinculo_id} className="flex items-center justify-between gap-3">
            <span>
              {preso.nome}{' '}
              <span className="text-muted-foreground">· {plural(preso.convites, 'convite', 'convites')}</span>
            </span>
            {editavel ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={liberar.isPending}
                onClick={() =>
                  liberar.mutate(preso.vinculo_id, {
                    onSuccess: () => toast.success(`Convites de ${preso.nome} liberados.`),
                    onError: avisarErro,
                  })
                }
              >
                Liberar
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
