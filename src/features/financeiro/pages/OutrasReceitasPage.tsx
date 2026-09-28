import { CalendarClock, CircleCheck, HandCoins, Plus, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Chip } from '@/components/Chip'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltroDePeriodo } from '@/components/FiltroDePeriodo'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ColunaOrdenavel, Planilha } from '@/components/Planilha'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { usePapel } from '@/hooks/useSessao'
import { ehDia, formatarCentavos } from '@/lib/formato'
import { ehOpcao } from '@/lib/opcao'
import { DialogoDeOutraReceita } from '../components/DialogoDeOutraReceita'
import { LinhaDeOutraReceita } from '../components/LinhaDeOutraReceita'
import { useOutrasReceitas, useResumoDeOutrasReceitas } from '../hooks/useOutrasReceitas'
import {
  type CategoriaDeOutraReceita,
  ROTULOS_DE_CATEGORIA_DE_OUTRA_RECEITA,
  type OutraReceita,
  type ResumoDeOutrasReceitas,
} from '../types/financeiro.types'

const TAMANHO_DA_PAGINA = 20

/** Os filtros de situação, com a chave do resumo que conta cada um. */
const FILTROS = {
  Prevista: { rotulo: 'A receber', soma: 'prevista' },
  atrasadas: { rotulo: 'Atrasadas', soma: 'atrasada' },
  Recebida: { rotulo: 'Recebidas', soma: 'recebida' },
  Cancelada: { rotulo: 'Canceladas', soma: 'cancelada' },
} as const satisfies Record<string, { rotulo: string; soma: keyof ResumoDeOutrasReceitas }>

const ehCategoria = (valor: string | null): valor is CategoriaDeOutraReceita =>
  ehOpcao(valor, ROTULOS_DE_CATEGORIA_DE_OUTRA_RECEITA)

/**
 * O dinheiro que entra sem ser parcela de formando: patrocínio, evento, doação, rendimento.
 *
 * É a tela de despesas com outro título e outra cor de valor (decisão 1 da Sprint 28). A receita
 * prevista aparece aqui e na projeção do caixa, e só a recebida conta no arrecadado e na meta da
 * festa (P2). Situação, categoria, período e busca vivem na URL, como em Despesas.
 */
export default function OutrasReceitasPage() {
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()
  const [dialogo, definirDialogo] = useState<false | { outraReceita?: OutraReceita }>(false)
  const { tem } = usePapel()
  // Ler é de todo membro; lançar, receber e cancelar são da Tesouraria — a API recusa o resto.
  const tesouraria = tem(PAPEIS.tesoureiro)
  const editavel = useEscritaLiberada() && tesouraria

  const situacao = parametros.get('situacao')
  const status =
    situacao === 'Prevista' || situacao === 'Recebida' || situacao === 'Cancelada' ? situacao : undefined
  const atrasadas = situacao === 'atrasadas'
  const categoriaNaUrl = parametros.get('categoria')
  const categoria = ehCategoria(categoriaNaUrl) ? categoriaNaUrl : undefined
  const deNaUrl = parametros.get('de')
  const de = ehDia(deNaUrl) ? deNaUrl : undefined
  const ateNaUrl = parametros.get('ate')
  const ate = ehDia(ateNaUrl) ? ateNaUrl : undefined
  const filtrando = Boolean(situacao || categoria || de || ate || busca)

  const ordenacao = useOrdenacao(atualizar)
  const outrasReceitas = useOutrasReceitas({
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
  const resumo = useResumoDeOutrasReceitas({ categoria, de, ate, busca: busca || undefined }).data

  // A página pedida deixou de existir (filtro mais estreito): volta para a última que existe.
  if (outrasReceitas.data && outrasReceitas.data.itens.length === 0 && pagina > 1) {
    const ultima = new URLSearchParams(parametros)
    ultima.set('pagina', String(Math.max(1, outrasReceitas.data.total_paginas)))
    return <Navigate to={{ search: ultima.toString() }} replace />
  }

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo das outras receitas"
        indicadores={[
          {
            rotulo: de || ate ? 'Outras receitas no período' : 'Outras receitas',
            valor: resumo?.todas.quantidade ?? null,
            icone: HandCoins,
          },
          {
            rotulo: 'A receber',
            valor: resumo ? formatarCentavos(resumo.prevista.valor_em_centavos) : null,
            icone: CalendarClock,
          },
          {
            rotulo: 'Atrasado',
            valor: resumo ? formatarCentavos(resumo.atrasada.valor_em_centavos) : null,
            icone: TriangleAlert,
            sinal: resumo?.atrasada.quantidade ? { texto: 'cobrar', tom: 'negativo' } : undefined,
          },
          {
            rotulo: 'Recebido',
            valor: resumo ? formatarCentavos(resumo.recebida.valor_em_centavos) : null,
            icone: CircleCheck,
          },
        ]}
      />

      <FiltrosDaPlanilha
        principal={
          <Chip
            tom="claro"
            ativo={!situacao}
            contagem={resumo?.todas.quantidade}
            onClick={() => atualizar({ situacao: null })}
          >
            Todas
          </Chip>
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
          rotulo: 'Buscar receita',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        contagem={{
          mostrando: outrasReceitas.data?.itens.length ?? 0,
          total: outrasReceitas.data?.total ?? 0,
          unidade: 'receitas',
        }}
        acoes={
          <>
            <BotaoDeFiltros id="filtros-de-receitas" ligados={(categoria ? 1 : 0) + (de || ate ? 1 : 0)}>
              <fieldset className="grid gap-2">
                <legend className="text-muted-foreground mb-2 text-sm">Categoria</legend>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ROTULOS_DE_CATEGORIA_DE_OUTRA_RECEITA).map(([valor, rotulo]) => (
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

            {tesouraria ? (
              <Button size="xs" disabled={!editavel} onClick={() => definirDialogo({})}>
                <Plus aria-hidden />
                Nova receita
              </Button>
            ) : null}
          </>
        }
      />

      <Planilha
        rotulo="Lista de outras receitas"
        consulta={outrasReceitas}
        vazio={{
          titulo: filtrando ? 'Nenhuma receita com esses filtros' : 'Nenhuma receita lançada',
          dica: filtrando
            ? 'Tente outra situação, outra categoria ou outro período.'
            : 'Lance o que entra sem ser parcela — patrocínio, festa junina, doação, rendimento — e o caixa passa a fechar com o extrato do banco.',
        }}
        ordenacao={ordenacao}
        cabecalho={
          <>
            <ColunaOrdenavel coluna="receita">Receita</ColunaOrdenavel>
            <ColunaOrdenavel coluna="data">Data</ColunaOrdenavel>
            <ColunaOrdenavel coluna="valor" numerica>
              Valor
            </ColunaOrdenavel>
            <th className="py-3 pr-4 font-normal">Situação</th>
          </>
        }
        aoMudarPagina={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
      >
        {(outrasReceitas.data?.itens ?? []).map((outraReceita) => (
          <LinhaDeOutraReceita
            key={outraReceita.id}
            outraReceita={outraReceita}
            tesouraria={tesouraria}
            editavel={editavel}
            aoEditar={() => definirDialogo({ outraReceita })}
          />
        ))}
      </Planilha>

      <DialogoDeOutraReceita aberto={dialogo} aoFechar={() => definirDialogo(false)} />
    </>
  )
}
