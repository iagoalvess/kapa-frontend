import { zodResolver } from '@hookform/resolvers/zod'
import { Ban, TicketPercent } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { toast } from 'sonner'
import { AcaoComConfirmacao, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { Cartao } from '@/components/Cartao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatarData, formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useCriarCupom, useCupons, useDesativarCupom } from '../hooks/useCupons'
import { cupomEmBranco, esquemaDeCupom, type FormularioDeCupom, paraNovoCupom } from '../schemas/cupom.schema'
import type { Cupom } from '../types/painel.types'

/**
 * Os cupons da primeira cobrança (Sprint 51): criar e desativar. Não há editar — cupom usado com outro percentual
 * faria o histórico das turmas mentir; desativa e cria outro.
 *
 * O desconto vale só na primeira cobrança, no mensal ou no anual, e vai até 50%: cupom vaza em grupo de WhatsApp.
 */
export default function CuponsDoPainelPage() {
  const cupons = useCupons()
  const desativar = useDesativarCupom()
  const [criando, definirCriando] = useState(false)
  const [agora] = useState(Date.now)

  return (
    <section className="grid gap-6">
      <Cartao
        icone={TicketPercent}
        titulo="Cupons de desconto"
        descricao="Cada cupom dá o desconto que você definir, de 1% a 50%, só no primeiro pagamento da turma. Turma que já pagou não usa cupom."
        acao={
          <Button size="sm" onClick={() => definirCriando(true)}>
            Novo cupom
          </Button>
        }
      >
        {cupons.isPending ? <EsqueletoDeTabela colunas={5} /> : null}
        {cupons.isError ? (
          <ErroDaConsulta compacto erro={cupons.error} aoTentarDeNovo={() => void cupons.refetch()} />
        ) : null}
        {cupons.data && cupons.data.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum cupom criado ainda.</p>
        ) : null}

        {cupons.data && cupons.data.length > 0 ? (
          <Tabela
            emLista
            legenda="Cupons"
            cabecalho={
              <>
                <th className="py-3 pr-4 font-normal">Código</th>
                <th className="py-3 pr-4 font-normal">Desconto</th>
                <th className="py-3 pr-4 font-normal">Usos</th>
                <th className="py-3 pr-4 font-normal">Válido até</th>
                <th className="py-3 pr-4 font-normal">Situação</th>
              </>
            }
          >
            {cupons.data.map((cupom) => (
              <tr key={cupom.id} className="border-b last:border-0">
                <td className="text-foreground py-3 pr-4 font-mono font-medium">{cupom.codigo}</td>
                <td className="py-3 pr-4">{cupom.percentual}%</td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  {formatarNumero(cupom.usos)} de {formatarNumero(cupom.limite_de_usos)}
                </td>
                <td className="py-3 pr-4 whitespace-nowrap">{formatarData(cupom.valido_ate)}</td>
                <td className="py-3 pr-4">
                  <SeloDoCupom cupom={cupom} agora={agora} />
                </td>
                <td className="py-3 text-right">
                  {cupom.ativo ? (
                    <AcoesDaLinha rotulo={`Ações de ${cupom.codigo}`}>
                      <AcaoComConfirmacao
                        rotulo="Desativar"
                        descricaoAcessivel={`Desativar ${cupom.codigo}`}
                        icone={Ban}
                        desabilitada={desativar.isPending}
                        confirmacao={{
                          titulo: `Desativar o cupom “${cupom.codigo}”?`,
                          descricao:
                            'Ele deixa de valer na hora. As turmas que já contrataram com ele não mudam.',
                          rotulo: 'Desativar',
                          aoConfirmar: () =>
                            desativar.mutate(cupom.id, {
                              onSuccess: () => toast.info(`Cupom ${cupom.codigo} desativado.`),
                              onError: avisarErro,
                            }),
                        }}
                      />
                    </AcoesDaLinha>
                  ) : null}
                </td>
              </tr>
            ))}
          </Tabela>
        ) : null}
      </Cartao>

      <DialogoDeFormulario
        aberto={criando}
        aoFechar={() => definirCriando(false)}
        titulo="Novo cupom"
        descricao="Vale só na primeira cobrança de uma turma que nunca pagou. Não dá para editar depois."
      >
        <FormularioDeCupomNovo key={String(criando)} aoConcluir={() => definirCriando(false)} />
      </DialogoDeFormulario>
    </section>
  )
}

/**
 * A situação do cupom: desativado, esgotado, vencido ou valendo.
 *
 * @param agora O instante da abertura da tela, lido uma vez — a hora não pode mudar entre renderizações.
 */
function SeloDoCupom({ cupom, agora }: { cupom: Cupom; agora: number }) {
  if (!cupom.ativo) return <Selo>Desativado</Selo>
  if (cupom.usos >= cupom.limite_de_usos) return <Selo tom="alerta">Esgotado</Selo>
  if (new Date(cupom.valido_ate).getTime() <= agora) return <Selo tom="alerta">Vencido</Selo>

  return <Selo tom="sucesso">Valendo</Selo>
}

/** Código, desconto, validade e limite de usos. */
function FormularioDeCupomNovo({ aoConcluir }: { aoConcluir: () => void }) {
  const criar = useCriarCupom()
  const formulario = useForm<FormularioDeCupom, unknown, z.output<typeof esquemaDeCupom>>({
    resolver: zodResolver(esquemaDeCupom),
    defaultValues: cupomEmBranco(),
  })

  const enviar = formulario.handleSubmit((valores) =>
    criar.mutate(paraNovoCupom(valores), {
      onSuccess: (cupom) => {
        toast.success(`Cupom ${cupom.codigo} criado.`)
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
            name="codigo"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="off"
                    maxLength={20}
                    placeholder="PILOTO-UFMG"
                    onChange={(evento) => field.onChange(evento.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={formulario.control}
            name="percentual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desconto (%)</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="numeric" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={formulario.control}
            name="limite_de_usos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limite de turmas</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="numeric" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={formulario.control}
            name="valido_ate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Válido até</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ErroDoFormulario />

        <AcoesDoFormulario aoCancelar={aoConcluir} ocupado={criar.isPending} />
      </form>
    </Form>
  )
}
