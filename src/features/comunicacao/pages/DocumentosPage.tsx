import { Clock, FolderOpen, HardDrive, Layers, Upload } from 'lucide-react'
import { useState } from 'react'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { Paginacao } from '@/components/Paginacao'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarDataRelativa, formatarTamanho } from '@/lib/formato'
import { QuadroDeDocumentos } from '../components/QuadroDeDocumentos'
import { UploadDeDocumento } from '../components/UploadDeDocumento'
import {
  filtrarDocumentos,
  type FiltroDoQuadro,
  useDocumentos,
  useResumoDoAcervo,
} from '../hooks/useDocumentos'
import {
  type CategoriaDeDocumento,
  type Documento,
  ROTULOS_DE_CATEGORIA,
  ROTULOS_DE_TIPO,
  type TipoDeArquivo,
} from '../types/comunicacao.types'

/** O teto do servidor: o acervo de uma turma cabe numa página, e o quadro pede a lista toda. */
const TAMANHO_DA_PAGINA = 100

/** Para quem é, como vai na URL. Só a Gestão escolhe: o formando só recebe os da turma. */
const VISIBILIDADES = {
  turma: { rotulo: 'Da turma', valor: 'Turma' },
  comissao: { rotulo: 'Só da comissão', valor: 'SomenteComissao' },
} as const

/** A ordem dentro das colunas, como vai na URL, e o que ela vira na API. */
const ORDENS = {
  recentes: { rotulo: 'Mais recentes', ordenar_por: 'enviado_em', descendente: true },
  antigos: { rotulo: 'Mais antigos', ordenar_por: 'enviado_em', descendente: false },
  titulo: { rotulo: 'Título (A–Z)', ordenar_por: 'titulo', descendente: false },
} as const

type Ordem = keyof typeof ORDENS

const ehVisibilidade = (valor: string | null): valor is keyof typeof VISIBILIDADES =>
  valor !== null && valor in VISIBILIDADES
const ehTipo = (valor: string | null): valor is TipoDeArquivo => valor !== null && valor in ROTULOS_DE_TIPO
const ehOrdem = (valor: string | null): valor is Ordem => valor !== null && valor in ORDENS

/**
 * O acervo da turma num quadro: uma coluna por categoria — atas, contratos, orçamentos,
 * regulamentos e outros.
 *
 * Acima do quadro, as duas linhas das telas de planilha (Membros, Adesões): para quem é (Gestão), o
 * tipo de arquivo e os últimos 30 dias em pílulas com contagem, a busca pelo título, o painel
 * "Filtros" com a ordem das colunas, e "Mostrando X de Y". Tudo na URL.
 *
 * Todo membro baixa o que pode ver — a API já tirou da resposta o que é só da comissão; a Gestão
 * adiciona (pelo botão ou pelo pé da coluna), corrige, substitui e exclui.
 */
export default function DocumentosPage() {
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()
  const { tem } = usePapel()
  const gestao = tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const editavel = useEscritaLiberada()
  const [dialogo, definirDialogo] = useState<
    false | { documento?: Documento; categoria?: CategoriaDeDocumento }
  >(false)

  const visibilidadeNaUrl = parametros.get('visibilidade')
  const visibilidade = gestao && ehVisibilidade(visibilidadeNaUrl) ? visibilidadeNaUrl : undefined
  const tipoNaUrl = parametros.get('tipo')
  const tipo = ehTipo(tipoNaUrl) ? tipoNaUrl : undefined
  const recentes = parametros.get('periodo') === '30d'
  const ordemNaUrl = parametros.get('ordem')
  const ordem: Ordem = ehOrdem(ordemNaUrl) ? ordemNaUrl : 'recentes'

  const documentos = useDocumentos({
    pagina,
    tamanho: TAMANHO_DA_PAGINA,
    ordenar_por: ORDENS[ordem].ordenar_por,
    descendente: ORDENS[ordem].descendente,
    busca: busca || undefined,
  })
  const resumo = useResumoDoAcervo()
  const itens = documentos.data?.itens ?? []

  const filtro: FiltroDoQuadro = {
    visibilidade: visibilidade ? VISIBILIDADES[visibilidade].valor : undefined,
    tipo,
    recentes,
  }
  const visiveis = filtrarDocumentos(itens, filtro)
  /** Quantos ficariam com esta pílula ligada e as outras como estão — o número dentro dela. */
  const contar = (mudanca: FiltroDoQuadro) =>
    documentos.data ? filtrarDocumentos(itens, { ...filtro, ...mudanca }).length : undefined
  const filtrando = Boolean(busca || visibilidade || tipo || recentes)

  /** Grava mudanças na URL; vazio remove o parâmetro. Filtro novo sempre volta à página 1. */
  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo do acervo"
        indicadores={[
          { rotulo: 'Documentos', valor: resumo.data?.quantidade ?? null, icone: FolderOpen },
          {
            rotulo: 'Categorias em uso',
            valor: resumo.data?.por_categoria.length ?? null,
            unidade: `de ${Object.keys(ROTULOS_DE_CATEGORIA).length}`,
            icone: Layers,
          },
          {
            rotulo: 'Espaço ocupado',
            valor: resumo.data ? formatarTamanho(resumo.data.bytes) : null,
            icone: HardDrive,
          },
          {
            rotulo: 'Mais recente',
            valor: resumo.data
              ? resumo.data.ultimo_envio
                ? formatarDataRelativa(resumo.data.ultimo_envio)
                : 'Nenhum'
              : null,
            icone: Clock,
          },
        ]}
      />

      <FiltrosDaPlanilha
        principal={
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Para quem é</legend>
            <Chip
              tom="claro"
              ativo={!visibilidade}
              contagem={contar({ visibilidade: undefined })}
              onClick={() => atualizar({ visibilidade: null })}
            >
              Todos
            </Chip>
            {gestao
              ? Object.entries(VISIBILIDADES).map(([chave, { rotulo, valor }]) => (
                  <Chip
                    key={chave}
                    tom="claro"
                    ativo={visibilidade === chave}
                    contagem={contar({ visibilidade: valor })}
                    onClick={() => atualizar({ visibilidade: visibilidade === chave ? null : chave })}
                  >
                    {rotulo}
                  </Chip>
                ))
              : null}
          </fieldset>
        }
        legenda="Tipo e período"
        filtros={
          <>
            {(Object.keys(ROTULOS_DE_TIPO) as TipoDeArquivo[]).map((valor) => (
              <Chip
                key={valor}
                ativo={tipo === valor}
                contagem={contar({ tipo: valor })}
                onClick={() => atualizar({ tipo: tipo === valor ? null : valor })}
              >
                {ROTULOS_DE_TIPO[valor]}
              </Chip>
            ))}
            <Chip
              ativo={recentes}
              contagem={contar({ recentes: true })}
              onClick={() => atualizar({ periodo: recentes ? null : '30d' })}
            >
              Últimos 30 dias
            </Chip>
          </>
        }
        busca={{
          valor: busca,
          rotulo: 'Buscar documento',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        acoes={
          <>
            <BotaoDeFiltros id="filtros-do-acervo" ligados={ordem === 'recentes' ? 0 : 1}>
              <fieldset className="grid gap-2">
                <legend className="text-muted-foreground mb-2 text-sm">Ordem nas colunas</legend>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ORDENS).map(([valor, { rotulo }]) => (
                    <Chip
                      key={valor}
                      ativo={ordem === valor}
                      onClick={() => atualizar({ ordem: valor === 'recentes' ? null : valor })}
                    >
                      {rotulo}
                    </Chip>
                  ))}
                </div>
              </fieldset>
            </BotaoDeFiltros>
            {gestao ? (
              <Button size="sm" className="h-8" disabled={!editavel} onClick={() => definirDialogo({})}>
                <Upload aria-hidden />
                {/* No celular, só o verbo: com o complemento, a busca ao lado fica espremida. */}
                Adicionar<span className="hidden sm:inline"> documento</span>
              </Button>
            ) : null}
          </>
        }
        contagem={{
          mostrando: visiveis.length,
          total: documentos.data?.total ?? 0,
          unidade: 'documentos',
        }}
      />

      {documentos.isPending ? <EsqueletoDeCartoes altura="h-64" /> : null}
      {documentos.isError ? <ErroDaConsulta erro={documentos.error} /> : null}
      {filtrando && documentos.data && visiveis.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhum documento com esses filtros. Tente outra busca ou tire algum filtro.
        </p>
      ) : null}

      {documentos.data ? (
        <QuadroDeDocumentos
          documentos={visiveis}
          gestao={gestao}
          editavel={editavel}
          aoAdicionar={(categoria) => definirDialogo({ categoria })}
          aoCorrigir={(documento) => definirDialogo({ documento })}
        />
      ) : null}

      {documentos.data ? (
        <Paginacao
          pagina={documentos.data.pagina}
          totalPaginas={documentos.data.total_paginas}
          total={documentos.data.total}
          ocupado={documentos.isPlaceholderData}
          aoMudar={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
        />
      ) : null}

      <UploadDeDocumento aberto={dialogo} aoFechar={() => definirDialogo(false)} />
    </>
  )
}
