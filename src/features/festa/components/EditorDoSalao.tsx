import { Armchair, Maximize, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Button } from '@/components/ui/button'
import { formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { useAvisoDeSaida } from '../hooks/useAvisoDeSaida'
import { useSalvarSalao } from '../hooks/useMesas'
import {
  centroDaMesa,
  encaixarElemento,
  METRO,
  type Ponto,
  redimensionarSalao,
  type Tamanho,
} from '../lib/salao'
import type {
  ElementoDoSalao,
  MapaDeMesas,
  Mesa,
  PlantaDoSalao,
  PosicaoDaMesa,
  TipoDeElemento,
} from '../types/mesas.types'
import { ELEMENTOS_DO_SALAO, TIPOS_DE_ELEMENTO } from '../lib/catalogoDoSalao'
import { DialogoDeMesa } from './DialogoDeMesa'
import { MapaDoSalao, type MesaNoMapa, type Selecao } from './MapaDoSalao'
import { Legenda } from './salao/Legenda'
import { PainelDaMesa } from './salao/PainelDaMesa'
import { PainelDoElemento } from './salao/PainelDoElemento'
import { PainelDoSalao } from './salao/PainelDoSalao'

interface Props {
  mapa: MapaDeMesas
  /** Com a turma ativa; fora disso o mapa é só de ler. */
  editavel: boolean
}

/** Mesa com lugar no mapa. */
type MesaPosicionada = Mesa & { x: number; y: number }

const ZOOM_MINIMO = 0.5
const ZOOM_MAXIMO = 3

/**
 * O editor do mapa do salão, na Gestão (28/09/2026).
 *
 * O desenho — tamanho do salão, elementos e o lugar das mesas — é um rascunho local até o "Salvar
 * mapa", que grava tudo de uma vez: arrastar é tentativa e erro, e uma chamada por arraste deixaria
 * o mapa de quem abre no meio com metade das mesas no lugar novo. O cadastro da mesa (nome, lugares,
 * dono) não entra no rascunho: grava na hora, como na lista.
 *
 * Mesa nova e mesa que ainda não tem lugar ficam na faixa "Fora do mapa"; um clique a põe no meio do
 * salão, de onde se arrasta.
 */
export function EditorDoSalao({ mapa, editavel }: Props) {
  const [planta, definirPlanta] = useState<PlantaDoSalao | null>(null)
  const [posicoes, definirPosicoes] = useState<Record<string, PosicaoDaMesa>>({})
  const [selecionado, selecionar] = useState<Selecao | null>(null)
  const [zoom, definirZoom] = useState(1)
  const [dialogo, definirDialogo] = useState<false | { mesa?: Mesa }>(false)
  const salvar = useSalvarSalao()

  const salao = planta ?? mapa.salao
  const mesas = mapa.lista.map((mesa) => {
    const posicao = posicoes[mesa.id]
    return posicao ? { ...mesa, x: posicao.x, y: posicao.y, girada: posicao.girada } : mesa
  })
  const noMapa = mesas.filter((mesa): mesa is MesaPosicionada => mesa.x !== null && mesa.y !== null)
  const foraDoMapa = mesas.filter((mesa) => mesa.x === null || mesa.y === null)
  const sujo = planta !== null || Object.keys(posicoes).length > 0
  const saida = useAvisoDeSaida(sujo)

  const mesaEscolhida =
    selecionado?.tipo === 'mesa' ? mesas.find((mesa) => mesa.id === selecionado.id) : undefined
  const elementoEscolhido = selecionado?.tipo === 'elemento' ? salao.elementos[selecionado.indice] : undefined
  const meio = { x: salao.largura / 2, y: salao.altura / 2 }
  // Cada mesa que entra cai um metro na diagonal da anterior, em ciclos de cinco: todas no mesmo
  // ponto ficariam empilhadas, e a de cima esconderia as outras do clique.
  const degrau = (noMapa.length % 5) * METRO
  const lugarDaProxima = { x: meio.x + degrau, y: meio.y + degrau }

  const posicionar = (mesa: Mesa, ponto: Ponto | null, girada = mesa.girada, emQueSalao: Tamanho = salao) => {
    const centro = ponto ? centroDaMesa({ ...mesa, girada }, ponto, emQueSalao) : { x: null, y: null }
    if (centro.x === mesa.x && centro.y === mesa.y && girada === mesa.girada) return
    definirPosicoes((atuais) => ({
      ...atuais,
      [mesa.id]: { mesa_id: mesa.id, x: centro.x, y: centro.y, girada },
    }))
  }

  const trocarElementos = (troca: (elementos: ElementoDoSalao[]) => ElementoDoSalao[]) =>
    definirPlanta({ ...salao, elementos: troca(salao.elementos) })

  const mudarElemento = (indice: number, mudanca: Partial<ElementoDoSalao>) =>
    trocarElementos((elementos) =>
      elementos.map((elemento, i) =>
        i === indice ? encaixarElemento({ ...elemento, ...mudanca }, salao) : elemento,
      ),
    )

  const incluirElemento = (elemento: ElementoDoSalao) => {
    trocarElementos((elementos) => [...elementos, encaixarElemento(elemento, salao)])
    selecionar({ tipo: 'elemento', indice: salao.elementos.length })
  }

  const removerElemento = (indice: number) => {
    trocarElementos((elementos) => elementos.filter((_, i) => i !== indice))
    selecionar(null)
  }

  const mudarSalao = (tamanho: Tamanho) => {
    const novo = redimensionarSalao(salao, tamanho)
    definirPlanta(novo)
    for (const mesa of noMapa) posicionar(mesa, mesa, mesa.girada, novo)
  }

  const descartar = () => {
    definirPlanta(null)
    definirPosicoes({})
    selecionar(null)
  }

  const gravar = () =>
    salvar.mutate(
      { ...salao, posicoes: Object.values(posicoes) },
      {
        onSuccess: () => {
          definirPlanta(null)
          definirPosicoes({})
          toast.success('Mapa salvo.')
        },
        onError: avisarErro,
      },
    )

  return (
    <div className="grid gap-4">
      {editavel ? (
        <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Adicionar ao salão">
          <span className="text-muted-foreground mr-1 text-sm">Adicionar</span>
          <Button variant="outline" size="xs" onClick={() => definirDialogo({})}>
            <Armchair aria-hidden />
            Mesa
          </Button>
          {TIPOS_DE_ELEMENTO.map((tipo) => {
            const { rotulo, icone: Icone } = ELEMENTOS_DO_SALAO[tipo]
            return (
              <Button
                key={tipo}
                variant="outline"
                size="xs"
                onClick={() => incluirElemento(novoElemento(tipo, meio))}
              >
                <Icone aria-hidden />
                {rotulo}
              </Button>
            )
          })}
        </div>
      ) : null}

      {editavel && foraDoMapa.length > 0 ? (
        <div className="bg-brand-wash flex flex-wrap items-center gap-2 rounded-2xl p-3">
          <span className="text-brand-text text-sm font-medium">
            Fora do mapa ({formatarNumero(foraDoMapa.length)})
          </span>
          <span className="text-muted-foreground text-sm">— clique para pôr no salão:</span>
          {foraDoMapa.map((mesa) => (
            <Button
              key={mesa.id}
              variant="outline"
              size="xs"
              className="bg-card"
              onClick={() => {
                posicionar(mesa, lugarDaProxima)
                selecionar({ tipo: 'mesa', id: mesa.id })
              }}
            >
              {mesa.identificacao}
              <span className="text-muted-foreground font-normal">
                {formatarNumero(mesa.lugares)} lugares
              </span>
            </Button>
          ))}
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Legenda />
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Diminuir"
                disabled={zoom <= ZOOM_MINIMO}
                onClick={() => definirZoom((atual) => Math.max(ZOOM_MINIMO, atual - 0.25))}
              >
                <Minus aria-hidden />
              </Button>
              <span className="w-12 text-center text-sm tabular-nums" aria-live="polite">
                {formatarNumero(Math.round(zoom * 100))}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Aumentar"
                disabled={zoom >= ZOOM_MAXIMO}
                onClick={() => definirZoom((atual) => Math.min(ZOOM_MAXIMO, atual + 0.25))}
              >
                <Plus aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Ajustar à tela"
                onClick={() => definirZoom(1)}
              >
                <Maximize aria-hidden />
              </Button>
            </div>
          </div>
          <div className="bg-background max-h-[75dvh] overflow-auto rounded-2xl border p-3">
            <MapaDoSalao
              salao={salao}
              mesas={noMapa.map(paraOMapa)}
              rotulo="Mapa do salão"
              zoom={zoom}
              selecionado={selecionado}
              aoSelecionar={editavel ? selecionar : undefined}
              aoMover={(alvo, ponto) => {
                if (alvo.tipo === 'elemento') {
                  mudarElemento(alvo.indice, ponto)
                  return
                }
                const mesa = noMapa.find((candidata) => candidata.id === alvo.id)
                if (mesa) posicionar(mesa, ponto)
              }}
              aoRedimensionar={(indice, tamanho) => mudarElemento(indice, tamanho)}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Cada ponto da grade é 1 metro. Arraste para mover; com o item escolhido, as setas movem de 20 em
            20 cm (com Shift, de metro em metro).
          </p>
        </div>

        <aside
          className="bg-background grid content-start gap-4 rounded-2xl border p-4"
          aria-label="Item escolhido"
        >
          {mesaEscolhida ? (
            <PainelDaMesa
              mesa={mesaEscolhida}
              compradores={mapa.compradores}
              editavel={editavel}
              aoEditar={() => definirDialogo({ mesa: mesaEscolhida })}
              aoGirar={() =>
                posicionar(
                  mesaEscolhida,
                  mesaEscolhida.x === null || mesaEscolhida.y === null
                    ? null
                    : { x: mesaEscolhida.x, y: mesaEscolhida.y },
                  !mesaEscolhida.girada,
                )
              }
              aoTirarDoMapa={() => {
                posicionar(mesaEscolhida, null)
                selecionar(null)
              }}
              aoExcluir={() => {
                definirPosicoes((atuais) =>
                  Object.fromEntries(Object.entries(atuais).filter(([id]) => id !== mesaEscolhida.id)),
                )
                selecionar(null)
              }}
            />
          ) : elementoEscolhido && selecionado?.tipo === 'elemento' ? (
            <PainelDoElemento
              elemento={elementoEscolhido}
              editavel={editavel}
              aoMudar={(mudanca) => mudarElemento(selecionado.indice, mudanca)}
              aoDuplicar={() =>
                incluirElemento({
                  ...elementoEscolhido,
                  x: elementoEscolhido.x + METRO,
                  y: elementoEscolhido.y + METRO,
                })
              }
              aoRemover={() => removerElemento(selecionado.indice)}
            />
          ) : (
            <PainelDoSalao salao={salao} editavel={editavel} aoMudar={mudarSalao} />
          )}

          {editavel ? (
            <div className="grid gap-2 border-t pt-4">
              <Button onClick={gravar} disabled={!sujo || salvar.isPending}>
                {salvar.isPending ? 'Salvando…' : 'Salvar mapa'}
              </Button>
              {sujo ? (
                <Button variant="ghost" onClick={descartar} disabled={salvar.isPending}>
                  Descartar mudanças
                </Button>
              ) : (
                <p className="text-muted-foreground text-center text-xs">Nenhuma mudança por salvar.</p>
              )}
            </div>
          ) : null}
        </aside>
      </div>

      <DialogoDeMesa
        aberto={dialogo}
        aoFechar={() => definirDialogo(false)}
        aoCriar={(mesa) => {
          posicionar(mesa, lugarDaProxima)
          selecionar({ tipo: 'mesa', id: mesa.id })
        }}
      />

      <DialogoDeConfirmacao
        aberto={saida.state === 'blocked'}
        aoFechar={() => saida.reset?.()}
        titulo="Sair sem salvar o mapa?"
        descricao="As mudanças no mapa ainda não foram salvas e se perdem se você sair."
        rotulo="Sair sem salvar"
        rotuloDeCancelar="Continuar no mapa"
        destrutivo
        aoConfirmar={() => saida.proceed?.()}
      />
    </div>
  )
}

/** O elemento como nasce da paleta, no meio do salão; a área nasce laranja, o resto sem cor. */
function novoElemento(tipo: TipoDeElemento, meio: Ponto): ElementoDoSalao {
  const { rotulo, largura, altura } = ELEMENTOS_DO_SALAO[tipo]
  return {
    tipo,
    rotulo,
    largura,
    altura,
    x: meio.x - largura / 2,
    y: meio.y - altura / 2,
    cor: tipo === 'Area' ? 'Laranja' : null,
  }
}

/** A mesa como o mapa a desenha: a cor diz se tem dono, e a legenda, de quem. */
function paraOMapa(mesa: MesaPosicionada): MesaNoMapa {
  return {
    ...mesa,
    tom: mesa.reservada ? 'reservada' : mesa.vinculo_id ? 'dono' : 'livre',
    legenda: mesa.reservada ? 'Reservada' : (mesa.dono ?? mesa.observacao),
  }
}
