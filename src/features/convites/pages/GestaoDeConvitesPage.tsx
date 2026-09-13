import { zodResolver } from '@hookform/resolvers/zod'
import type { ComponentProps, ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PAPEIS, type Papel, ROTULOS_DE_PAPEL } from '@/config/perfis'
import { useEscritaLiberada, useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarData, formatarNumero } from '@/lib/formato'
import { exibirErroNoFormulario } from '@/lib/http/formulario'
import { mensagemDoErro } from '@/lib/http/erros'
import { FormularioDeConvite } from '../components/FormularioDeConvite'
import { LinkDaTurma } from '../components/LinkDaTurma'
import { useConvites, useCriarConvite, useRevogarConvite } from '../hooks/useConvites'
import {
  esquemaDeLinkDaTurma,
  type FormularioDeLinkDaTurma,
  VALIDADES_DO_LINK,
} from '../schemas/convite.schema'
import type { ConviteResumo, StatusDoConvite } from '../types/convite.types'

type TomDoSelo = NonNullable<ComponentProps<typeof Selo>['tom']>

/**
 * Como cada situação aparece. No link da turma "pendente" é o link valendo e "aceito" é o limite
 * de entradas atingido — a API usa o mesmo vocabulário para os dois tipos.
 */
const SITUACOES: Record<StatusDoConvite, { nominal: string; link: string; tom: TomDoSelo }> = {
  Pendente: { nominal: 'Pendente', link: 'Ativo', tom: 'alerta' },
  Aceito: { nominal: 'Aceito', link: 'Esgotado', tom: 'sucesso' },
  Expirado: { nominal: 'Expirado', link: 'Expirado', tom: 'neutro' },
  Revogado: { nominal: 'Revogado', link: 'Revogado', tom: 'perigo' },
}

/**
 * Convites da turma: o link aberto para o grupo e os convites por e-mail.
 *
 * Gestão (Comissão e Tesouraria) convida formandos; só o Presidente escolhe outro papel — a tela
 * esconde a escolha, e a API recusa com `convite.papel_restrito` de qualquer forma.
 *
 * Antes de pagar, a comissão já se monta (convite por e-mail de Tesoureiro, Comissão e
 * Presidente), mas formando só entra com a turma ativa — o link da turma espera a contratação.
 */
export default function GestaoDeConvitesPage() {
  const { ehPresidente } = usePapel()
  const contratada = useEscritaLiberada()
  const montavel = useEscritaLiberada('editavel')
  const papeis = papeisOferecidos(ehPresidente, contratada)
  const convites = useConvites()
  const formatura = useFormaturaAtual()

  // Sugestão da sprint: formandos estimados + 10%. É o limite que fecha a porta para o link vazado.
  const sugestao = formatura.data ? String(Math.ceil(formatura.data.quantidadeEstimadaDeFormandos * 1.1)) : ''

  const estado = convites.isPending ? (
    <p className="text-muted-foreground text-sm">Carregando…</p>
  ) : convites.isError ? (
    <p role="alert" className="text-destructive text-sm">
      {mensagemDoErro(convites.error)}
    </p>
  ) : null

  return (
    <>
      <Secao
        titulo="Link da turma"
        descricao={
          contratada
            ? 'Para colar no grupo da turma ou projetar na assembleia. Quem entra por ele entra como Formando.'
            : 'Liberado depois da contratação: os formandos entram quando a turma estiver ativa.'
        }
      >
        {/* Chave pela sugestão: o formulário nasce de novo quando a formatura termina de carregar. */}
        <FormularioDoLink key={sugestao} sugestao={sugestao} desabilitado={!contratada} />
        {estado ?? <ListaDeConvites tipo="link" convites={convites.data?.filter((c) => !c.email) ?? []} />}
      </Secao>

      <Secao
        titulo="Convites por e-mail"
        descricao={
          contratada
            ? 'O link vai para o e-mail da pessoa e só funciona numa conta com esse e-mail. Vale por 7 dias.'
            : 'Antes de contratar, chame a comissão para decidir o plano junto. O link vai para o e-mail da pessoa e vale por 7 dias.'
        }
      >
        {/* Chave pelos papéis: a escolha padrão muda quando o status da turma termina de carregar. */}
        <FormularioDeConvite key={papeis.join()} papeis={papeis} desabilitado={!montavel} />
        {estado ?? (
          <ListaDeConvites tipo="nominal" convites={convites.data?.filter((c) => !!c.email) ?? []} />
        )}
      </Secao>
    </>
  )
}

/**
 * O que quem está logado pode oferecer por e-mail agora.
 *
 * @param ehPresidente Só o Presidente convida para a comissão.
 * @param contratada Com a turma paga, formando também entra.
 */
function papeisOferecidos(ehPresidente: boolean, contratada: boolean): Papel[] {
  const comissao = [PAPEIS.tesoureiro, PAPEIS.comissao, PAPEIS.presidente]
  if (!contratada) return ehPresidente ? comissao : []

  return ehPresidente ? [PAPEIS.formando, ...comissao] : [PAPEIS.formando]
}

function Secao({ titulo, descricao, children }: { titulo: string; descricao: string; children: ReactNode }) {
  return (
    <section aria-label={titulo} className="bg-card shadow-cartao grid gap-4 rounded-2xl p-5">
      <div>
        <h2 className="text-foreground text-lg font-medium">{titulo}</h2>
        <p className="text-muted-foreground text-sm">{descricao}</p>
      </div>
      {children}
    </section>
  )
}

function FormularioDoLink({ sugestao, desabilitado }: { sugestao: string; desabilitado: boolean }) {
  const criar = useCriarConvite()

  const formulario = useForm<FormularioDeLinkDaTurma>({
    resolver: zodResolver(esquemaDeLinkDaTurma),
    defaultValues: { diasDeValidade: '90', usosMaximos: sugestao },
  })

  const gerar = formulario.handleSubmit(({ diasDeValidade, usosMaximos }) =>
    criar.mutate(
      {
        diasDeValidade: Number(diasDeValidade),
        usosMaximos: usosMaximos.trim() === '' ? undefined : Number(usosMaximos),
      },
      { onError: (erro) => exibirErroNoFormulario(erro, formulario.setError) },
    ),
  )

  return (
    <div className="grid gap-4">
      <Form {...formulario}>
        <form noValidate onSubmit={gerar} className="grid gap-3 sm:grid-cols-[auto_auto_1fr] sm:items-end">
          <FormField
            control={formulario.control}
            name="diasDeValidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Validade</FormLabel>
                <FormControl>
                  <select
                    className="border-border bg-card focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                    {...field}
                  >
                    {VALIDADES_DO_LINK.map((dias) => (
                      <option key={dias} value={String(dias)}>
                        {dias} dias
                      </option>
                    ))}
                  </select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={formulario.control}
            name="usosMaximos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limite de entradas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="Sem limite"
                    className="sm:w-36"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="justify-self-start" disabled={criar.isPending || desabilitado}>
            {criar.isPending ? 'Gerando…' : 'Gerar link'}
          </Button>

          {formulario.formState.errors.root?.message ? (
            <p role="alert" className="text-destructive text-sm sm:col-span-3">
              {formulario.formState.errors.root.message}
            </p>
          ) : null}
        </form>
      </Form>

      {criar.data ? <LinkDaTurma link={criar.data.link} /> : null}
    </div>
  )
}

function ListaDeConvites({ tipo, convites }: { tipo: 'link' | 'nominal'; convites: ConviteResumo[] }) {
  if (convites.length === 0) {
    return (
      <p className="text-muted-foreground motion-safe:animate-entrar text-sm">
        {tipo === 'link' ? 'Nenhum link gerado ainda.' : 'Nenhum convite enviado ainda.'}
      </p>
    )
  }

  return (
    <div className="motion-safe:animate-entrar overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-texto-muted text-left text-xs">
          <tr className="border-b">
            {tipo === 'link' ? (
              <th className="py-3 pr-4 font-normal">Criado em</th>
            ) : (
              <>
                <th className="py-3 pr-4 font-normal">E-mail</th>
                <th className="py-3 pr-4 font-normal">Papel</th>
              </>
            )}
            <th className="py-3 pr-4 font-normal">Válido até</th>
            {tipo === 'link' ? <th className="py-3 pr-4 font-normal">Entradas</th> : null}
            <th className="py-3 pr-4 font-normal">Situação</th>
            <th className="py-3 font-normal">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {convites.map((convite) => (
            <LinhaDeConvite key={convite.id} tipo={tipo} convite={convite} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LinhaDeConvite({ tipo, convite }: { tipo: 'link' | 'nominal'; convite: ConviteResumo }) {
  const revogar = useRevogarConvite()
  const escritaLiberada = useEscritaLiberada('editavel')
  const situacao = SITUACOES[convite.status]
  const descricao =
    tipo === 'link' ? `link criado em ${formatarData(convite.criadoEm)}` : `convite de ${convite.email}`

  return (
    <tr className="border-b last:border-0">
      {tipo === 'link' ? (
        <td className="py-3 pr-4">{formatarData(convite.criadoEm)}</td>
      ) : (
        <>
          <td className="max-w-56 truncate py-3 pr-4">{convite.email}</td>
          <td className="py-3 pr-4">{ROTULOS_DE_PAPEL[convite.papel]}</td>
        </>
      )}
      <td className="py-3 pr-4">{formatarData(convite.expiraEm)}</td>
      {tipo === 'link' ? (
        <td className="py-3 pr-4">
          {formatarNumero(convite.usosFeitos)}
          {convite.usosMaximos ? ` de ${formatarNumero(convite.usosMaximos)}` : ''}
        </td>
      ) : null}
      <td className="py-3 pr-4">
        <Selo tom={situacao.tom}>{situacao[tipo]}</Selo>
      </td>
      <td className="py-3 text-right">
        {convite.status === 'Pendente' ? (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            aria-label={`Revogar ${descricao}`}
            disabled={revogar.isPending || !escritaLiberada}
            onClick={() =>
              revogar.mutate(convite.id, {
                onSuccess: () => toast.success('Convite revogado. O link parou de funcionar.'),
                onError: (erro) => toast.error(mensagemDoErro(erro)),
              })
            }
          >
            Revogar
          </Button>
        ) : null}
      </td>
    </tr>
  )
}
