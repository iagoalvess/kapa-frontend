import { CalendarClock, CircleCheck, Plus, Receipt, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Chip } from '@/components/Chip'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltroDePeriodo, faixasDeVencimento } from '@/components/FiltroDePeriodo'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ColunaOrdenavel, Planilha } from '@/components/Planilha'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useItensDaFesta } from '@/hooks/useItensDaFesta'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { usePapel } from '@/hooks/useSessao'
import { ehDia, formatarCentavos } from '@/lib/formato'
import { DialogoDeDespesa } from '../components/DialogoDeDespesa'
import { LinhaDeDespesa } from '../components/LinhaDeDespesa'
import { useDespesas, useResumoDeDespesas } from '../hooks/useDespesas'
import { useFornecedores } from '../hooks/useFornecedores'
import {
  type CategoriaDeDespesa,
  type Despesa,
  ROTULOS_DE_CATEGORIA,
  type ResumoDeDespesas,
} from '../types/financeiro.types'

const TAMANHO_DA_PAGINA = 20

/** Os filtros de situação, com a chave do resumo que conta cada um. */
const FILTROS = {
  Prevista: { rotulo: 'A pagar', soma: 'prevista' },
  atrasadas: { rotulo: 'Atrasadas', soma: 'atrasada' },
  Paga: { rotulo: 'Pagas', soma: 'paga' },
  Cancelada: { rotulo: 'Canceladas', soma: 'cancelada' },
} as const satisfies Record<string, { rotulo: string; soma: keyof ResumoDeDespesas }>

const ehCategoria = (valor: string | null): valor is CategoriaDeDespesa =>
  valor !== null && valor in ROTULOS_DE_CATEGORIA

/**
 * O que a turma deve e o que já pagou, por vencimento — a tela do tesoureiro.
 *
 * No desenho de Parcelas, a tela irmã: dinheiro no topo, pílulas com contagem, busca e o painel de
 * filtros à direita, a lista embaixo. Situação, categoria, período e busca vivem na URL, então
 * recarregar e mandar o link devolvem a mesma lista.
 *
 * "Atrasadas" é um filtro, não um status: são as previstas com vencimento no passado, calculadas na
 * leitura — a mesma regra de `Vencida` na parcela.
 */
export default function DespesasPage() {
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()
  const [lancamento, definirLancamento] = useState<false | { despesa?: Despesa }>(false)
  const { tem } = usePapel()
  // Ler é de todo membro; lançar, pagar e cancelar continuam da Tesouraria — a API recusa o resto.
  const tesouraria = tem(PAPEIS.tesoureiro)
  const editavel = useEscritaLiberada() && tesouraria

  const situacao = parametros.get('situacao')
  const status =
    situacao === 'Prevista' || situacao === 'Paga' || situacao === 'Cancelada' ? situacao : undefined
  const atrasadas = situacao === 'atrasadas'
  const categoriaNaUrl = parametros.get('categoria')
  const categoria = ehCategoria(categoriaNaUrl) ? categoriaNaUrl : undefined
  const deNaUrl = parametros.get('de')
  const de = ehDia(deNaUrl) ? deNaUrl : undefined
  const ateNaUrl = parametros.get('ate')
  const ate = ehDia(ateNaUrl) ? ateNaUrl : undefined
  const filtrando = Boolean(situacao || categoria || de || ate || busca)
  const semana = faixasDeVencimento()['Esta semana']

  /** Grava mudanças na URL; vazio remove o parâmetro. Filtro novo sempre volta à página 1. */
  const ordenacao = useOrdenacao(atualizar)
  const despesas = useDespesas({
    pagina,
    tamanho: TAMANHO_DA_PAGINA,
    status,
    atrasadas: atrasadas || undefined,
    categoria,
    de,
    ate,
    busca: busca || undefined,
    ...ordenacao.filtro,
  })
  const resumo = useResumoDeDespesas({ categoria, de, ate, busca: busca || undefined }).data
  // A lista alimenta o `select` do diálogo de lançamento, e só ele: fechado, não se consulta.
  // Cadastro de fornecedor é da Tesouraria — para os demais a consulta nem sai, e voltaria 403.
  const fornecedores =
    useFornecedores({ ativo: true, tamanho: 100 }, tesouraria && lancamento !== false).data?.itens ?? []

  /*
    O botão "Contratar" do cartão da festa chega aqui como `?item=<id>`: a tela abre o lançamento já
    preenchido pelo item. O estado vem da URL, e não de um `useEffect`, porque o link também é o
    caminho de volta — recarregar a página reabre o mesmo diálogo, e fechar limpa o parâmetro.
  */
  const itemNaUrl = parametros.get('item')
  const itensDaFesta =
    useItensDaFesta(lancamento !== false || itemNaUrl !== null).data?.filter((item) => !item.cancelado) ?? []
  const contratando = itemNaUrl ? itensDaFesta.find((item) => item.id === itemNaUrl) : undefined

  const fecharLancamento = () => {
    definirLancamento(false)
    if (itemNaUrl) atualizar({ item: null })
  }

  // A página pedida deixou de existir (filtro mais estreito): volta para a última que existe.
  if (despesas.data && despesas.data.itens.length === 0 && pagina > 1) {
    const ultima = new URLSearchParams(parametros)
    ultima.set('pagina', String(Math.max(1, despesas.data.total_paginas)))
    return <Navigate to={{ search: ultima.toString() }} replace />
  }

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo das despesas"
        indicadores={[
          {
            rotulo: de || ate ? 'Despesas no período' : 'Despesas',
            valor: resumo?.todas.quantidade ?? null,
            icone: Receipt,
          },
          {
            rotulo: 'A pagar',
            valor: resumo ? formatarCentavos(resumo.prevista.valor_em_centavos) : null,
            icone: CalendarClock,
          },
          {
            rotulo: 'Atrasado',
            valor: resumo ? formatarCentavos(resumo.atrasada.valor_em_centavos) : null,
            icone: TriangleAlert,
            sinal: resumo?.atrasada.quantidade ? { texto: 'pagar', tom: 'negativo' } : undefined,
          },
          {
            rotulo: 'Pago',
            valor: resumo ? formatarCentavos(resumo.paga.valor_em_centavos) : null,
            icone: CircleCheck,
          },
        ]}
      />

      <FiltrosDaPlanilha
        principal={
          <>
            <Chip
              tom="claro"
              ativo={!situacao}
              contagem={resumo?.todas.quantidade}
              onClick={() => atualizar({ situacao: null })}
            >
              Todas
            </Chip>
            {/* Atalho para o que o tesoureiro olha todo dia: o que vence até domingo. Grava o mesmo
                `de`/`ate` da faixa "Esta semana" do painel, então as duas pílulas acendem juntas. */}
            <Chip
              ativo={de === semana[0] && ate === semana[1]}
              onClick={() =>
                atualizar(
                  de === semana[0] && ate === semana[1]
                    ? { de: null, ate: null }
                    : { de: semana[0], ate: semana[1] },
                )
              }
            >
              Vence esta semana
            </Chip>
          </>
        }
        legenda="Situação"
        filtros={Object.entries(FILTROS).map(([valor, { rotulo, soma }]) => (
          <Chip
            key={valor}
            ativo={situacao === valor}
            contagem={resumo?.[soma].quantidade}
            onClick={() => atualizar({ situacao: situacao === valor ? null : valor })}
          >
            {rotulo}
          </Chip>
        ))}
        busca={{
          valor: busca,
          rotulo: 'Buscar despesa',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        contagem={{
          mostrando: despesas.data?.itens.length ?? 0,
          total: despesas.data?.total ?? 0,
          unidade: 'despesas',
        }}
        acoes={
          <>
            <BotaoDeFiltros id="filtros-de-despesas" ligados={(categoria ? 1 : 0) + (de || ate ? 1 : 0)}>
              {/* Categoria e vencimento em pílulas, como o painel de Membros. */}
              <fieldset className="grid gap-2">
                <legend className="text-muted-foreground mb-2 text-sm">Categoria</legend>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ROTULOS_DE_CATEGORIA).map(([valor, rotulo]) => (
                    <Chip
                      key={valor}
                      ativo={categoria === valor}
                      onClick={() => atualizar({ categoria: categoria === valor ? null : valor })}
                    >
                      {rotulo}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <FiltroDePeriodo className="mt-4" de={de} ate={ate} aoMudar={atualizar} />
            </BotaoDeFiltros>

            {/* Some para quem não é da Tesouraria; desabilitado, prometeria uma ação que nunca vai
                ser dele. Para a Tesouraria com a turma fora de Ativa, aí sim: fica cinza. */}
            {tesouraria ? (
              <Button size="sm" className="h-8" disabled={!editavel} onClick={() => definirLancamento({})}>
                <Plus aria-hidden />
                Lançar despesa
              </Button>
            ) : null}
          </>
        }
      />

      <Planilha
        rotulo="Lista de despesas"
        consulta={despesas}
        vazio={{
          titulo: filtrando ? 'Nenhuma despesa com esses filtros' : 'Nenhuma despesa lançada',
          dica: filtrando
            ? 'Tente outra situação, outra categoria ou outro período.'
            : 'Lance o que a turma contratou — o buffet, o espaço, a banda — e o caixa passa a mostrar os dois lados.',
        }}
        ordenacao={ordenacao}
        cabecalho={
          <>
            <ColunaOrdenavel coluna="despesa">Despesa</ColunaOrdenavel>
            <ColunaOrdenavel coluna="vencimento">Vencimento</ColunaOrdenavel>
            <ColunaOrdenavel coluna="valor" numerica>
              Valor
            </ColunaOrdenavel>
            {/* "Atrasada" não é coluna do banco: sai do vencimento contra hoje, e não ordena. */}
            <th className="py-3 pr-4 font-normal">Situação</th>
            <th className="py-3 font-normal">
              <span className="sr-only">Ações</span>
            </th>
          </>
        }
        aoMudarPagina={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
      >
        {(despesas.data?.itens ?? []).map((despesa) => (
          <LinhaDeDespesa key={despesa.id} despesa={despesa} editavel={editavel} />
        ))}
      </Planilha>

      <DialogoDeDespesa
        aberto={lancamento !== false ? lancamento : contratando ? {} : false}
        fornecedores={fornecedores}
        itensDaFesta={itensDaFesta}
        contratando={contratando}
        aoFechar={fecharLancamento}
      />
    </>
  )
}
