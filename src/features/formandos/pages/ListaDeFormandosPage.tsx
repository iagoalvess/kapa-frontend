import { Search, TriangleAlert } from 'lucide-react'
import type { FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { Avatar } from '@/components/Avatar'
import { Chip } from '@/components/Chip'
import { Paginacao } from '@/components/Paginacao'
import { Selo } from '@/components/Selo'
import { ROTULOS_DE_PAPEL } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { formatarNumero } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { useFormandos, usePendentes } from '../hooks/useFormandos'
import type { FormandoResumo, SituacaoDoCadastro } from '../types/formandos.types'

const TAMANHO_DA_PAGINA = 20

/** Situações do filtro, como vão na URL e na API. Ausente é "todos". */
const SITUACOES: Record<SituacaoDoCadastro, string> = {
  Pendente: 'Falta o essencial',
  Incompleto: 'Incompletos',
  Completo: 'Completos',
}

const ehSituacao = (valor: string | null): valor is SituacaoDoCadastro => valor !== null && valor in SITUACOES

/**
 * Cadastro da turma, visto pela comissão: quem já preencheu, quanto, e quem ainda deve o essencial.
 *
 * Página, busca e situação vivem na URL: voltar, recarregar e mandar o link devolvem a mesma lista.
 * O aviso do topo conta quem falta nome completo, CPF ou telefone — sem eles não há cobrança.
 */
export default function ListaDeFormandosPage() {
  const [parametros, definirParametros] = useSearchParams()
  const pendentes = usePendentes()

  const pagina = Math.max(1, Math.trunc(Number(parametros.get('pagina'))) || 1)
  const busca = parametros.get('busca')?.trim() ?? ''
  const situacaoNaUrl = parametros.get('situacao')
  const situacao = ehSituacao(situacaoNaUrl) ? situacaoNaUrl : undefined

  const formandos = useFormandos({ pagina, tamanho: TAMANHO_DA_PAGINA, busca: busca || undefined, situacao })

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

  // A página pedida deixou de existir (filtro mudou o total): volta para a última que existe.
  if (formandos.data && formandos.data.itens.length === 0 && pagina > 1) {
    const ultima = new URLSearchParams(parametros)
    ultima.set('pagina', String(Math.max(1, formandos.data.totalPaginas)))
    return <Navigate to={{ search: ultima.toString() }} replace />
  }

  return (
    <>
      {pendentes.data ? (
        <output className="bg-warning-bg text-warning-text flex items-center gap-2 rounded-2xl px-5 py-3 text-sm">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          {pendentes.data === 1
            ? '1 formando ainda não preencheu nome completo, CPF e telefone — sem eles não há cobrança.'
            : `${formatarNumero(pendentes.data)} formandos ainda não preencheram nome completo, CPF e telefone — sem eles não há cobrança.`}
          {situacao === 'Pendente' ? null : (
            <button
              type="button"
              className="ml-auto font-medium underline"
              onClick={() => atualizar({ situacao: 'Pendente' })}
            >
              Ver quem
            </button>
          )}
        </output>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Situação do cadastro</legend>
          <Chip tom="claro" ativo={situacao === undefined} onClick={() => atualizar({ situacao: null })}>
            Todos
          </Chip>
          {Object.entries(SITUACOES).map(([valor, rotulo]) => (
            <Chip
              key={valor}
              tom="claro"
              ativo={situacao === valor}
              onClick={() => atualizar({ situacao: valor })}
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
              placeholder="Buscar formando"
              aria-label="Buscar formando"
              className="border-border placeholder:text-texto-muted focus-visible:ring-ring h-8 w-full rounded-full border bg-transparent pr-3 pl-9 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
            <button type="submit" className="sr-only">
              Buscar
            </button>
          </form>
        </search>
      </div>

      <section aria-label="Lista de formandos" className="bg-card shadow-cartao rounded-2xl px-5 py-2">
        {formandos.isPending ? <p className="text-muted-foreground py-4 text-sm">Carregando…</p> : null}

        {formandos.isError ? (
          <p role="alert" className="text-destructive py-4 text-sm">
            {mensagemDoErro(formandos.error)}
          </p>
        ) : null}

        {formandos.data?.itens.length === 0 ? (
          <p className="text-muted-foreground motion-safe:animate-entrar py-4 text-sm">
            Nenhum formando encontrado.
          </p>
        ) : null}

        {formandos.data && formandos.data.itens.length > 0 ? (
          <div className="motion-safe:animate-entrar overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-texto-muted text-left text-xs">
                <tr className="border-b">
                  <th className="py-3 pr-4 font-normal">Formando</th>
                  <th className="py-3 pr-4 font-normal">Papel</th>
                  <th className="py-3 pr-4 font-normal">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {formandos.data.itens.map((formando) => (
                  <LinhaDeFormando key={formando.usuarioId} formando={formando} />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {formandos.data ? (
        <Paginacao
          pagina={formandos.data.pagina}
          totalPaginas={formandos.data.totalPaginas}
          total={formandos.data.total}
          ocupado={formandos.isPlaceholderData}
          aoMudar={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
        />
      ) : null}
    </>
  )
}

function LinhaDeFormando({ formando }: { formando: FormandoResumo }) {
  const nome = formando.nomeCompleto ?? formando.nome

  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <Avatar nome={nome} semente={formando.usuarioId} className="size-8 text-sm" />
          <div className="grid min-w-0">
            <Link
              to={`${ROTAS.formandos}/${formando.usuarioId}`}
              className="text-foreground truncate font-medium hover:underline"
            >
              {nome}
            </Link>
            <span className="text-texto-muted truncate">{formando.email}</span>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4">
        <Selo>{ROTULOS_DE_PAPEL[formando.papel]}</Selo>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground w-10 tabular-nums">{formando.completude}%</span>
          {formando.essencialPendente ? (
            <Selo tom="alerta">Falta o essencial</Selo>
          ) : formando.completude === 100 ? (
            <Selo tom="sucesso">Completo</Selo>
          ) : null}
        </div>
      </td>
    </tr>
  )
}
