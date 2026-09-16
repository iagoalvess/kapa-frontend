import { Handshake, Plus, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { toast } from 'sonner'
import { Chip } from '@/components/Chip'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ColunaOrdenavel, Planilha } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { rotaDoFornecedor } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import { DialogoDeFornecedor } from '../components/DialogoDeFornecedor'
import { useContagemDeFornecedores, useExcluirFornecedor, useFornecedores } from '../hooks/useFornecedores'
import { formatarDocumento, type Fornecedor, ROTULOS_DE_CATEGORIA } from '../types/financeiro.types'

const TAMANHO_DA_PAGINA = 20

/**
 * Quem a turma contrata: buffet, banda, fotógrafo, gráfica — com o que já saiu e o que ainda vai
 * sair para cada um.
 *
 * O desenho é o da tela de membros: filtros e busca numa linha, a lista numa tabela de largura
 * inteira e o cadastro num diálogo. O nome abre o detalhe do fornecedor.
 *
 * Fornecedor com despesa lançada não é excluído: a API devolve 409, e o caminho é desativar, que o
 * tira do seletor de despesa sem apagar o histórico de gastos.
 */
export default function FornecedoresPage() {
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()
  const contagem = useContagemDeFornecedores()
  const [cadastro, definirCadastro] = useState<false | { fornecedor?: Fornecedor }>(false)
  const editavel = useEscritaLiberada()

  const situacao = parametros.get('situacao')
  const ativo = situacao === 'ativos' ? true : situacao === 'inativos' ? false : undefined
  const filtrando = Boolean(situacao || busca)

  /** Grava mudanças na URL; vazio remove o parâmetro. Filtro novo sempre volta à página 1. */
  const ordenacao = useOrdenacao(atualizar)
  const fornecedores = useFornecedores({
    pagina,
    tamanho: TAMANHO_DA_PAGINA,
    ativo,
    busca: busca || undefined,
    ...ordenacao.filtro,
  })
  const itens = fornecedores.data?.itens ?? []

  // Excluiu o último da última página: a página pedida deixou de existir, volta para a última.
  if (fornecedores.data && itens.length === 0 && pagina > 1) {
    const ultima = new URLSearchParams(parametros)
    ultima.set('pagina', String(Math.max(1, fornecedores.data.total_paginas)))
    return <Navigate to={{ search: ultima.toString() }} replace />
  }

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo dos fornecedores"
        indicadores={[
          { rotulo: 'Fornecedores', valor: fornecedores.data?.total ?? null, icone: Handshake },
          {
            rotulo: 'Pago a fornecedores',
            valor: fornecedores.data
              ? formatarCentavos(itens.reduce((soma, item) => soma + item.pago_em_centavos, 0))
              : null,
            icone: Wallet,
          },
          {
            rotulo: 'Ainda a pagar',
            valor: fornecedores.data
              ? formatarCentavos(itens.reduce((soma, item) => soma + item.previsto_em_centavos, 0))
              : null,
            icone: Wallet,
          },
          {
            rotulo: 'Com despesa lançada',
            valor: fornecedores.data ? itens.filter((item) => item.quantidade_de_despesas > 0).length : null,
            unidade: `de ${itens.length}`,
            icone: Handshake,
          },
        ]}
      />

      <FiltrosDaPlanilha
        principal={
          <Chip
            tom="claro"
            ativo={!situacao}
            contagem={contagem?.todos}
            onClick={() => atualizar({ situacao: null })}
          >
            Todos
          </Chip>
        }
        legenda="Situação"
        filtros={(['ativos', 'inativos'] as const).map((valor) => (
          <Chip
            key={valor}
            ativo={situacao === valor}
            contagem={contagem?.[valor]}
            onClick={() => atualizar({ situacao: situacao === valor ? null : valor })}
          >
            {valor === 'ativos' ? 'Ativos' : 'Inativos'}
          </Chip>
        ))}
        busca={{
          valor: busca,
          rotulo: 'Buscar fornecedor',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        acoes={
          <Button size="sm" className="h-8" disabled={!editavel} onClick={() => definirCadastro({})}>
            <Plus aria-hidden />
            Novo fornecedor
          </Button>
        }
        contagem={{
          mostrando: itens.length,
          total: fornecedores.data?.total ?? 0,
          unidade: 'fornecedores',
        }}
      />

      <Planilha
        rotulo="Lista de fornecedores"
        consulta={fornecedores}
        vazio={{
          titulo: filtrando ? 'Nenhum fornecedor com esses filtros' : 'Nenhum fornecedor cadastrado',
          dica: filtrando
            ? 'Tente outro nome ou outra situação.'
            : 'Cadastre quem a turma contrata — o cadastro só precisa do nome e da categoria.',
        }}
        ordenacao={ordenacao}
        cabecalho={
          <>
            <ColunaOrdenavel coluna="nome">Fornecedor</ColunaOrdenavel>
            <ColunaOrdenavel coluna="categoria">Categoria</ColunaOrdenavel>
            {/* "Pago" e "A pagar" saem de subconsulta sobre despesas: não ordenam. */}
            <th className="py-3 pr-4 text-right font-normal">Pago</th>
            <th className="py-3 pr-4 text-right font-normal">A pagar</th>
            <ColunaOrdenavel coluna="situacao">Situação</ColunaOrdenavel>
            <th className="py-3 font-normal">
              <span className="sr-only">Ações</span>
            </th>
          </>
        }
        aoMudarPagina={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
      >
        {itens.map((fornecedor) => (
          <LinhaDeFornecedor key={fornecedor.id} fornecedor={fornecedor} editavel={editavel} />
        ))}
      </Planilha>

      <DialogoDeFornecedor aberto={cadastro} aoFechar={() => definirCadastro(false)} />
    </>
  )
}

/**
 * Uma linha do cadastro: quem é, de que categoria, quanto já saiu e quanto falta. O nome abre o
 * detalhe, que é onde se edita; aqui fica só o excluir.
 *
 * @param editavel Falso trava as ações de escrita — formatura fora de `Ativa`.
 */
function LinhaDeFornecedor({ fornecedor, editavel }: { fornecedor: Fornecedor; editavel: boolean }) {
  const excluir = useExcluirFornecedor()

  return (
    // Inativo fica esmaecido, como o membro removido: está na lista, mas não disputa atenção.
    <tr className={cn('border-b last:border-0', !fornecedor.ativo && 'text-muted-foreground')}>
      {/* O nome nomeia a linha: cabeçalho de linha, como na lista de despesas — é o que o leitor de
          tela repete antes de cada valor. */}
      <th
        scope="row"
        className={cn('grid min-w-52 py-3 pr-4 text-left font-normal', !fornecedor.ativo && 'opacity-70')}
      >
        <Link
          to={rotaDoFornecedor(fornecedor.id)}
          className="text-foreground truncate font-medium hover:underline"
        >
          {fornecedor.nome}
        </Link>
        <span className="text-texto-muted truncate text-xs font-normal">
          {fornecedor.documento ? formatarDocumento(fornecedor.documento) : 'Sem documento'}
          {fornecedor.email ? ` · ${fornecedor.email}` : ''}
        </span>
      </th>
      <td className="py-3 pr-4">
        <Selo tom="marca">{ROTULOS_DE_CATEGORIA[fornecedor.categoria]}</Selo>
      </td>
      <td className="py-3 pr-4 text-right whitespace-nowrap tabular-nums">
        {formatarCentavos(fornecedor.pago_em_centavos)}
        <span className="text-texto-muted block text-xs">
          {formatarNumero(fornecedor.quantidade_de_despesas)}{' '}
          {fornecedor.quantidade_de_despesas === 1 ? 'despesa' : 'despesas'}
        </span>
      </td>
      <td className="py-3 pr-4 text-right whitespace-nowrap tabular-nums">
        {fornecedor.previsto_em_centavos > 0 ? formatarCentavos(fornecedor.previsto_em_centavos) : '—'}
      </td>
      <td className="py-3 pr-4">
        {fornecedor.ativo ? <Selo tom="sucesso">Ativo</Selo> : <Selo>Inativo</Selo>}
      </td>
      <td className="py-3 text-right">
        <ExcluirFornecedor fornecedor={fornecedor} desabilitado={!editavel || excluir.isPending} />
      </td>
    </tr>
  )
}

/**
 * Excluir em duas etapas. O aviso muda de acordo com o cadastro: com despesa lançada a API recusa
 * (`financeiro.fornecedor_em_uso`), e o caminho é desativar.
 */
function ExcluirFornecedor({ fornecedor, desabilitado }: { fornecedor: Fornecedor; desabilitado: boolean }) {
  const excluir = useExcluirFornecedor()

  return (
    <DialogoDeConfirmacao
      gatilho={
        <Button variant="outline" size="sm" disabled={desabilitado} aria-label={`Excluir ${fornecedor.nome}`}>
          Excluir
        </Button>
      }
      titulo={`Excluir ${fornecedor.nome}?`}
      descricao={
        fornecedor.quantidade_de_despesas > 0
          ? 'Ele tem despesa lançada, e a API não vai deixar excluir. Desative o fornecedor na tela dele: some do seletor de despesa e o histórico de gastos fica.'
          : 'O cadastro é apagado. Não há como recuperar.'
      }
      rotulo="Excluir"
      destrutivo
      aoConfirmar={() =>
        excluir.mutate(fornecedor.id, {
          onSuccess: () => toast.info('Fornecedor excluído.'),
          onError: (erro) => toast.error(mensagemDoErro(erro)),
        })
      }
    />
  )
}
