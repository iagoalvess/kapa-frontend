import { Search } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Avatar } from '@/components/Avatar'
import { Chip } from '@/components/Chip'
import { Paginacao } from '@/components/Paginacao'
import { Selo } from '@/components/Selo'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { PAPEIS, type Papel, ROTULOS_DE_PAPEL } from '@/config/perfis'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel, useSessao } from '@/hooks/useSessao'
import { formatarNumero } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import { IndicadoresDeMembros } from '../components/IndicadoresDeMembros'
import {
  contar,
  useAlterarPapel,
  useMembros,
  useRemoverMembro,
  useResumoDeMembros,
} from '../hooks/useMembros'
import type { MembroDaFormatura } from '../types/membros.types'

const TAMANHO_DA_PAGINA = 20

/** Situação do vínculo, como vai na URL, e o filtro `ativo` que ela vira na API. */
const SITUACOES = {
  ativos: { rotulo: 'Ativos', ativo: true },
  removidos: { rotulo: 'Removidos', ativo: false },
  todos: { rotulo: 'Todos', ativo: undefined },
} as const

type Situacao = keyof typeof SITUACOES

const ehSituacao = (valor: string | null): valor is Situacao => valor !== null && valor in SITUACOES
const ehPapel = (valor: string | null): valor is Papel =>
  valor !== null && (Object.values(PAPEIS) as string[]).includes(valor)

/**
 * Membros da formatura: quem são, que papel têm, e quem sai.
 *
 * Comissão e Tesouraria veem a lista; só o Presidente troca papel e remove. Os controles somem
 * para quem não pode — a recusa de verdade é da API, que confere o papel no vínculo gravado.
 *
 * Página, busca, situação e papel vivem na URL: voltar, recarregar e mandar o link devolvem a
 * mesma lista. As contagens dos filtros acompanham a situação escolhida, para o número na
 * pílula ser o que a lista vai trazer ao clicar.
 */
export default function MembrosPage() {
  const [parametros, definirParametros] = useSearchParams()
  const { ehPresidente } = usePapel()
  const resumo = useResumoDeMembros()

  const pagina = Math.max(1, Math.trunc(Number(parametros.get('pagina'))) || 1)
  const busca = parametros.get('busca')?.trim() ?? ''
  const situacaoNaUrl = parametros.get('situacao')
  const situacao: Situacao = ehSituacao(situacaoNaUrl) ? situacaoNaUrl : 'ativos'
  const papelNaUrl = parametros.get('papel')
  const papel = ehPapel(papelNaUrl) ? papelNaUrl : undefined
  const ativo = SITUACOES[situacao].ativo

  const membros = useMembros({ pagina, tamanho: TAMANHO_DA_PAGINA, busca: busca || undefined, ativo, papel })

  const contagem = (filtro: Parameters<typeof contar>[1]) =>
    resumo.data ? contar(resumo.data, filtro) : undefined

  /** Grava mudanças na URL; `null` remove o parâmetro. Filtro novo sempre volta à página 1. */
  const atualizar = (mudancas: Record<string, string | null>) =>
    definirParametros((atuais) => {
      const proximos = new URLSearchParams(atuais)
      for (const [chave, valor] of Object.entries({ pagina: null, ...mudancas })) {
        if (valor === null || valor === '') proximos.delete(chave)
        else proximos.set(chave, valor)
      }
      return proximos
    })

  const buscar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const termo = new FormData(evento.currentTarget).get('busca')
    atualizar({ busca: typeof termo === 'string' ? termo.trim() : null })
  }

  // Removeu o último da última página: a página pedida deixou de existir, volta para a última que existe.
  if (membros.data && membros.data.itens.length === 0 && pagina > 1) {
    const ultima = new URLSearchParams(parametros)
    ultima.set('pagina', String(Math.max(1, membros.data.totalPaginas)))
    return <Navigate to={{ search: ultima.toString() }} replace />
  }

  return (
    <>
      <IndicadoresDeMembros />

      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Situação</legend>
            {Object.entries(SITUACOES).map(([valor, { rotulo, ativo: filtroAtivo }]) => (
              <Chip
                key={valor}
                tom="claro"
                ativo={situacao === valor}
                contagem={contagem({ ativo: filtroAtivo, papel })}
                onClick={() => atualizar({ situacao: valor === 'ativos' ? null : valor })}
              >
                {rotulo}
              </Chip>
            ))}
          </fieldset>

          <search className="ml-auto w-full sm:w-64">
            <form onSubmit={buscar} className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              {/* Chave pela busca da URL: voltar no histórico repõe o texto do campo. */}
              <input
                key={busca}
                name="busca"
                type="search"
                defaultValue={busca}
                placeholder="Buscar membro"
                aria-label="Buscar membro"
                className="border-border placeholder:text-texto-muted focus-visible:ring-ring h-8 w-full rounded-full border bg-transparent pr-3 pl-9 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
              <button type="submit" className="sr-only">
                Buscar
              </button>
            </form>
          </search>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Papel</legend>
            {Object.values(PAPEIS).map((valor) => (
              <Chip
                key={valor}
                ativo={papel === valor}
                contagem={contagem({ ativo, papel: valor })}
                onClick={() => atualizar({ papel: papel === valor ? null : valor })}
              >
                {ROTULOS_DE_PAPEL[valor]}
              </Chip>
            ))}
          </fieldset>

          {membros.data && resumo.data ? (
            <p className="text-muted-foreground ml-auto text-sm">
              Mostrando {formatarNumero(membros.data.total)} de {formatarNumero(contar(resumo.data, {}))}{' '}
              membros
            </p>
          ) : null}
        </div>
      </div>

      <section aria-label="Lista de membros" className="bg-card shadow-cartao rounded-2xl px-5 py-2">
        {membros.isPending ? <p className="text-muted-foreground py-4 text-sm">Carregando…</p> : null}

        {membros.isError ? (
          <p role="alert" className="text-destructive py-4 text-sm">
            {mensagemDoErro(membros.error)}
          </p>
        ) : null}

        {membros.data?.itens.length === 0 ? (
          <p className="text-muted-foreground motion-safe:animate-entrar py-4 text-sm">
            Nenhum membro encontrado.
          </p>
        ) : null}

        {membros.data && membros.data.itens.length > 0 ? (
          <div className="motion-safe:animate-entrar overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-texto-muted text-left text-xs">
                <tr className="border-b">
                  <th className="py-3 pr-4 font-normal">Membro</th>
                  <th className="py-3 pr-4 font-normal">Papel</th>
                  <th className="py-3 pr-4 font-normal">Situação</th>
                  {ehPresidente ? (
                    <th className="py-3 font-normal">
                      <span className="sr-only">Ações</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {membros.data.itens.map((membro) => (
                  <LinhaDeMembro key={membro.usuarioId} membro={membro} editavel={ehPresidente} />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {membros.data ? (
        <Paginacao
          pagina={membros.data.pagina}
          totalPaginas={membros.data.totalPaginas}
          total={membros.data.total}
          ocupado={membros.isPlaceholderData}
          aoMudar={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
        />
      ) : null}
    </>
  )
}

/** A mensagem da API já explica o que fazer (`formatura.ultimo_presidente` e companhia). */
function avisarErro(erro: unknown) {
  toast.error(mensagemDoErro(erro))
}

function LinhaDeMembro({ membro, editavel }: { membro: MembroDaFormatura; editavel: boolean }) {
  const { usuario } = useSessao()
  const alterar = useAlterarPapel()
  const remover = useRemoverMembro()

  // Papel escolhido para si mesmo, aguardando confirmação: deixar a presidência tira o próprio acesso.
  const [papelAConfirmar, definirPapelAConfirmar] = useState<Papel | null>(null)

  const escritaLiberada = useEscritaLiberada('editavel')

  // Formatura fora de Ativa: os controles ficam, desabilitados — quem recusa de verdade é a API.
  const ocupado = alterar.isPending || remover.isPending || !escritaLiberada
  const podeEditar = editavel && membro.ativo
  const ehOProprio = membro.usuarioId === usuario?.id

  const trocarPapel = (papel: Papel) =>
    alterar.mutate({ usuarioId: membro.usuarioId, papel }, { onError: avisarErro })

  const escolherPapel = (papel: Papel) => {
    if (ehOProprio && membro.papel === PAPEIS.presidente) definirPapelAConfirmar(papel)
    else trocarPapel(papel)
  }

  return (
    // Removido fica esmaecido, como os cartões fora de foco da referência: está na lista, mas
    // não disputa atenção com quem está ativo.
    <tr className={cn('border-b last:border-0', !membro.ativo && 'text-muted-foreground')}>
      <td className="py-3 pr-4">
        <div className={cn('flex items-center gap-3', !membro.ativo && 'opacity-60')}>
          <Avatar nome={membro.nome} semente={membro.usuarioId} className="size-8 text-sm" />
          <div className="grid min-w-0">
            <span className="text-foreground truncate font-medium">{membro.nome}</span>
            <span className="text-texto-muted truncate">{membro.email}</span>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4">
        {podeEditar ? (
          <select
            aria-label={`Papel de ${membro.nome}`}
            className="border-border bg-card focus-visible:ring-ring h-7 rounded-full border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
            value={membro.papel}
            disabled={ocupado}
            onChange={(evento) => escolherPapel(evento.target.value as Papel)}
          >
            {Object.values(PAPEIS).map((papel) => (
              <option key={papel} value={papel}>
                {ROTULOS_DE_PAPEL[papel]}
              </option>
            ))}
          </select>
        ) : (
          <Selo tom={membro.papel === PAPEIS.presidente ? 'marca' : 'neutro'}>
            {ROTULOS_DE_PAPEL[membro.papel]}
          </Selo>
        )}

        <AlertDialog
          open={papelAConfirmar !== null}
          onOpenChange={(aberto) => !aberto && definirPapelAConfirmar(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deixar a presidência?</AlertDialogTitle>
              <AlertDialogDescription>
                Você passará a {papelAConfirmar ? ROTULOS_DE_PAPEL[papelAConfirmar] : ''} e perderá, na hora,
                o acesso à gestão de membros e aos dados da turma.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => papelAConfirmar && trocarPapel(papelAConfirmar)}>
                Deixar a presidência
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
      <td className="py-3 pr-4">{membro.ativo ? <Selo tom="sucesso">Ativo</Selo> : <Selo>Removido</Selo>}</td>
      {editavel ? (
        <td className="py-3 text-right">
          {membro.ativo ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full" disabled={ocupado}>
                  Remover
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {ehOProprio ? 'Sair da formatura?' : `Remover ${membro.nome}?`}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {ehOProprio
                      ? 'Você perderá o acesso a esta turma. O seu histórico de pagamentos e adesão é mantido.'
                      : 'A pessoa perde o acesso à turma na hora. O histórico de pagamentos e adesão dela é mantido.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => remover.mutate(membro.usuarioId, { onError: avisarErro })}
                  >
                    {ehOProprio ? 'Sair' : 'Remover'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </td>
      ) : null}
    </tr>
  )
}
