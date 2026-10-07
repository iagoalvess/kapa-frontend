import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { ErroDoFormulario } from '@/components/ErroDoFormulario'
import { Select } from '@/components/Select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RotuloComInfo } from '@/components/InfoDoCampo'
import { diaDeHoje, formatarCentavos, formatarNumero } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { useFormandosDaTurma, useLancar } from '../hooks/useLancamentos'
import {
  esquemaDeLancamento,
  type FormularioDeLancamento,
  lancamentoEmBranco,
  paraDadosDoLancamento,
} from '../schemas/lancamento.schema'

/**
 * O lançamento avulso no vínculo de um formando (Sprint 48, D23): a multa da mesa quebrada, a segunda via — ou o
 * crédito, a bolsa e o desconto. Vira parcela como qualquer outra, no extrato, no PIX e no caixa.
 *
 * Remonta a cada abertura (quem chama passa a chave), como o diálogo da despesa: o lançamento anterior não fica no campo.
 */
export function DialogoDeLancamento({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const lancar = useLancar()
  const [busca, definirBusca] = useState('')
  const formandos = useFormandosDaTurma(busca)
  const formulario = useForm<FormularioDeLancamento>({
    resolver: zodResolver(esquemaDeLancamento),
    defaultValues: lancamentoEmBranco(),
  })
  const [natureza, valor, parcelas] = useWatch({
    control: formulario.control,
    name: ['natureza', 'valor_em_centavos', 'numero_de_parcelas'],
  })
  const vezes = Number(parcelas) || 1

  const enviar = formulario.handleSubmit((valores) =>
    lancar.mutate(paraDadosDoLancamento(valores), {
      onSuccess: () => {
        toast.success(valores.natureza === 'credito' ? 'Crédito lançado.' : 'Cobrança lançada.')
        aoFechar()
      },
      onError: (erro) => exibirErroNoFormulario(erro, formulario.setError),
    }),
  )

  return (
    <DialogoDeFormulario
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Novo lançamento"
      descricao="Uma cobrança ou um crédito só para um formando. Vira parcela no extrato dele; desfazer é encerrar."
      largura="largo"
    >
      <Form {...formulario}>
        <form onSubmit={enviar} noValidate className="grid gap-4">
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              {/* Busca enquanto digita: o seletor mostra os 20 primeiros que batem com o nome. */}
              <Input
                type="search"
                aria-label="Buscar formando"
                placeholder="Buscar formando pelo nome"
                value={busca}
                onChange={(evento) => definirBusca(evento.target.value)}
              />
              <FormField
                control={formulario.control}
                name="usuario_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formando</FormLabel>
                    <FormControl>
                      <Select {...field}>
                        <option value="">Escolha…</option>
                        {(formandos.data?.itens ?? []).map((formando) => (
                          <option key={formando.usuario_id} value={formando.usuario_id}>
                            {formando.nome_completo ?? formando.nome}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={formulario.control}
              name="descricao"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Multa da mesa quebrada, bolsa da comissão" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formulario.control}
              name="natureza"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>É</FormLabel>
                  <FormControl>
                    <Select {...field}>
                      <option value="cobranca">Uma cobrança — soma ao que ele deve</option>
                      <option value="credito">Um crédito — abate o que ele deve</option>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formulario.control}
              name="valor_em_centavos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor total</FormLabel>
                  <FormControl>
                    <CampoDeMoeda {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formulario.control}
              name="numero_de_parcelas"
              render={({ field }) => (
                <FormItem>
                  <RotuloComInfo info="Mensais, no mesmo dia do primeiro vencimento.">Parcelas</RotuloComInfo>
                  <FormControl>
                    <Input {...field} inputMode="numeric" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formulario.control}
              name="primeiro_vencimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primeiro vencimento</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" min={diaDeHoje()} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {valor > 0 ? (
            <p className="bg-muted text-muted-foreground rounded-xl px-4 py-3 text-sm">
              {natureza === 'credito' ? 'Abate ' : 'Cobra '}
              <span className="text-foreground font-medium tabular-nums">{formatarCentavos(valor)}</span>
              {vezes > 1
                ? ` em ${formatarNumero(vezes)} parcelas de cerca de ${formatarCentavos(Math.trunc(valor / vezes))}`
                : ' numa parcela'}
              . O formando vê no extrato dele.
            </p>
          ) : null}

          <ErroDoFormulario />

          <AcoesDoFormulario
            aoCancelar={aoFechar}
            ocupado={lancar.isPending}
            rotulo="Lançar"
            rotuloOcupado="Lançando…"
          />
        </form>
      </Form>
    </DialogoDeFormulario>
  )
}
