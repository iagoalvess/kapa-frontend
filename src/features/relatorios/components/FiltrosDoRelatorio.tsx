import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Chip } from '@/components/Chip'
import { ROTULOS_DE_STATUS } from '@/components/ChipDeStatus'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { diaDeHoje, formatarData } from '@/lib/formato'
import type { StatusDaParcela } from '@/types/cobranca'
import {
  type CategoriaDeDespesa,
  ROTULOS_DE_CATEGORIA,
  ROTULOS_DE_SITUACAO,
  type StatusDaDespesa,
} from '@/types/financeiro'
import {
  type FiltroDoRelatorio,
  type FormatoDoRelatorio,
  type OpcoesDeFiltro,
  recortesLigados,
  type TipoDeRelatorio,
} from '../types/relatorios.types'
import { MenuDeExportacao } from './MenuDeExportacao'
import { SeletorDeFiltro } from './SeletorDeFiltro'

/**
 * Os atalhos do modelo (`7D`, `30D`, `90D`, `1A`), em dias.
 *
 * Em dias, e não em meses: "90 dias" é o que o tesoureiro pede, e mês de 28 e de 31 dias tornaria
 * dois períodos "de 3 meses" diferentes entre si.
 */
const ATALHOS = [
  { chave: '7d', rotulo: '7 dias', dias: 7 },
  { chave: '30d', rotulo: '30 dias', dias: 30 },
  { chave: '90d', rotulo: '90 dias', dias: 90 },
  { chave: '1a', rotulo: '12 meses', dias: 365 },
] as const

/** O primeiro dia do ano do dia informado. */
const inicioDoAno = (hoje: string) => `${hoje.slice(0, 4)}-01-01`

/** O dia, `n` dias atrás, em `aaaa-mm-dd`. */
function diasAtras(hoje: string, dias: number) {
  const data = new Date(`${hoje}T12:00:00`)
  data.setDate(data.getDate() - dias)

  return data.toISOString().slice(0, 10)
}

/**
 * Um dia do período, em pílula justa: dentro dela vai só a data e o calendário.
 *
 * Continua o `<input type="date">` do navegador — ele já fala português, já valida e no celular abre
 * o seletor do sistema. O que se faz aqui é tirar a casca: a caixa alta e quadrada do formulário
 * destoava das pílulas ao redor.
 *
 * **A largura do campo é explícita, e é o piso.** Solto, ele mede 163px no Chrome, com uma faixa
 * vazia entre a data e o ícone que é interna ao campo — não sai com `padding`, com `field-sizing`
 * nem zerando os `::-webkit-`. Apertado, ele *corta* a data em vez de refluí-la: em 7,75rem o
 * calendário começa a sumir e em 6,5rem some o fim do ano. 8rem é o menor tamanho medido em que os
 * dois aparecem inteiros; com o `px-2` da pílula, dá 146px de ponta a ponta.
 *
 * O rótulo é `sr-only`: no lugar dele a tela mostra "a" entre as duas pílulas, que diz o mesmo em um
 * caractere. Sem rótulo nenhum, os dois campos seriam "dia" e "dia" no leitor de tela.
 *
 * @param rotulo "De" ou "Até" — só para o leitor de tela.
 * @param aoMudar Recebe o dia escolhido, ou `undefined` quando o campo é esvaziado.
 */
function CampoDeDia({
  id,
  rotulo,
  valor,
  min,
  max,
  aoMudar,
}: {
  id: string
  rotulo: string
  valor: string
  min?: string
  max?: string
  aoMudar: (dia: string | undefined) => void
}) {
  return (
    // `h-7`, a mesma altura do `Chip`: ao lado dos atalhos de período, 32px destoavam dos 28 deles.
    <div className="border-border focus-within:ring-ring flex h-7 w-fit items-center rounded-full border px-2 focus-within:ring-2">
      <Label htmlFor={id} className="sr-only">
        {rotulo}
      </Label>
      <Input
        id={id}
        type="date"
        value={valor}
        min={min}
        max={max}
        onChange={(evento) => aoMudar(evento.target.value || undefined)}
        // A borda e o foco são da pílula em volta: o campo aqui dentro é só a data e o ícone. Os
        // dois `::-webkit-` zeram o respiro que o Chrome põe em volta dos dois — é o que faz caberem
        // em 8rem. `w-32` também vence o `w-full` do `Input` (pelo `twMerge`), senão ele estica.
        className="h-auto w-32 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0 md:text-sm [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-datetime-edit]:p-0"
      />
    </div>
  )
}

/**
 * A barra de filtros da tela de relatórios, no padrão das listas do sistema: os períodos prontos na
 * linha de cima; o intervalo na mão embaixo; e à direita o painel "Filtros" e o menu Exportar.
 *
 * **À vista ficam o período e as três listas** — fornecedor, formando e item de cobrança —, que são
 * o que se escolhe de fato. No painel sobram as três situações, que são pílulas e cabem lá; o número
 * no botão conta só essas, já que fechado ele é o que as esconde.
 *
 * `<input type="date">` nativo, e não um calendário próprio: o do navegador já fala português, já
 * valida e no celular abre o do sistema.
 *
 * O atalho ligado é o que corresponde ao intervalo em vigor — trocar a data na mão desliga todos, e
 * é assim que a pessoa sabe que está num período personalizado.
 *
 * **Nem todo recorte vale para todo relatório** (`FILTROS_DO_RELATORIO`), e a barra mostra todos
 * assim mesmo: o relatório só é escolhido no menu Exportar, depois. Quem descarta o que não se
 * aplica é a API, e o subtítulo do arquivo diz o recorte que de fato valeu.
 *
 * @param filtro O recorte em vigor, já com as pontas do período resolvidas.
 * @param aoMudar Recebe o recorte novo; a tela grava na URL.
 * @param opcoes O que os seletores oferecem; ausente enquanto a consulta não voltou.
 * @param formato Excel ou PDF, como está na URL.
 * @param aoTrocarFormato Recebe o formato escolhido no menu.
 * @param aoExportar Recebe o relatório escolhido no menu.
 * @param ocupado Se há um download ou um pedido a caminho.
 */
export function FiltrosDoRelatorio({
  filtro,
  aoMudar,
  opcoes,
  formato,
  aoTrocarFormato,
  aoExportar,
  ocupado,
}: {
  filtro: FiltroDoRelatorio
  aoMudar: (filtro: FiltroDoRelatorio) => void
  opcoes: OpcoesDeFiltro | undefined
  formato: FormatoDoRelatorio
  aoTrocarFormato: (formato: FormatoDoRelatorio) => void
  aoExportar: (tipo: TipoDeRelatorio) => void
  ocupado: boolean
}) {
  const hoje = diaDeHoje()
  const de = filtro.de ?? inicioDoAno(hoje)
  const ate = filtro.ate ?? hoje

  const atalhoAtivo = ATALHOS.find((atalho) => ate === hoje && de === diasAtras(hoje, atalho.dias))?.chave
  const noAno = ate === hoje && de === inicioDoAno(hoje)

  /** Troca um campo do recorte, preservando o resto. */
  const trocar = (mudanca: Partial<FiltroDoRelatorio>) => aoMudar({ ...filtro, ...mudanca })

  return (
    <FiltrosDaPlanilha
      principal={
        <>
          <Chip tom="claro" ativo={noAno} onClick={() => trocar({ de: inicioDoAno(hoje), ate: hoje })}>
            Este ano
          </Chip>

          {/* Os períodos prontos sobem para a linha de cima, junto do "Este ano": são todos a mesma
              escolha de um clique. Embaixo fica o intervalo na mão, que é a exceção. */}
          {ATALHOS.map((atalho) => (
            <Chip
              key={atalho.chave}
              ativo={atalhoAtivo === atalho.chave}
              onClick={() => trocar({ de: diasAtras(hoje, atalho.dias), ate: hoje })}
            >
              {atalho.rotulo}
            </Chip>
          ))}
        </>
      }
      legenda="Período e recortes"
      filtros={
        <div className="flex flex-wrap items-center gap-1.5">
          <CampoDeDia
            id="periodo-de"
            rotulo="De"
            valor={de}
            max={ate}
            aoMudar={(dia) => trocar({ de: dia, ate })}
          />

          {/* Decorativo: quem nomeia os campos para o leitor de tela são os rótulos `sr-only`. */}
          <span aria-hidden className="text-muted-foreground text-sm">
            a
          </span>

          <CampoDeDia
            id="periodo-ate"
            rotulo="Até"
            valor={ate}
            min={de}
            aoMudar={(dia) => trocar({ ate: dia, de })}
          />

          {/* Os três "por quem"/"de quê" ficam aqui, à direita do período, e não no painel: são
              listas, e empilhadas dentro do cartão viravam uma coluna de caixas iguais. Sem rótulo
              à vista, quem nomeia cada uma é a opção vazia — "Fornecedores", "Formandos". */}
          <SeletorDeFiltro
            rotulo="Fornecedor"
            todos="Fornecedores"
            valor={filtro.fornecedor_id}
            opcoes={opcoes?.fornecedores ?? []}
            aoMudar={(id) => trocar({ fornecedor_id: id })}
          />

          <SeletorDeFiltro
            rotulo="Formando"
            todos="Formandos"
            valor={filtro.formando_id}
            opcoes={opcoes?.formandos ?? []}
            aoMudar={(id) => trocar({ formando_id: id })}
          />

          <SeletorDeFiltro
            rotulo="Item de cobrança"
            todos="Itens de cobrança"
            valor={filtro.item_de_cobranca_id}
            opcoes={opcoes?.itens ?? []}
            aoMudar={(id) => trocar({ item_de_cobranca_id: id })}
          />
        </div>
      }
      acoes={
        <>
          {/* Conta o período personalizado e os recortes do painel — os seletores da barra estão à
              vista, e somá-los aqui contaria duas vezes o que já se lê na tela. */}
          <BotaoDeFiltros
            id="filtros-do-relatorio"
            ligados={(atalhoAtivo || noAno ? 0 : 1) + recortesLigados(filtro)}
            largura="w-72"
          >
            <div className="grid gap-4">
              <fieldset className="grid gap-2">
                <legend className="text-muted-foreground mb-2 text-sm">Categoria da despesa</legend>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ROTULOS_DE_CATEGORIA).map(([valor, rotulo]) => (
                    <Chip
                      key={valor}
                      ativo={filtro.categoria === valor}
                      onClick={() =>
                        trocar({
                          categoria: filtro.categoria === valor ? undefined : (valor as CategoriaDeDespesa),
                        })
                      }
                    >
                      {rotulo}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <fieldset className="grid gap-2">
                <legend className="text-muted-foreground mb-2 text-sm">Situação da despesa</legend>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ROTULOS_DE_SITUACAO).map(([valor, rotulo]) => (
                    <Chip
                      key={valor}
                      ativo={filtro.situacao_da_despesa === valor}
                      onClick={() =>
                        trocar({
                          situacao_da_despesa:
                            filtro.situacao_da_despesa === valor ? undefined : (valor as StatusDaDespesa),
                        })
                      }
                    >
                      {rotulo}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <fieldset className="grid gap-2">
                <legend className="text-muted-foreground mb-2 text-sm">Situação da parcela</legend>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ROTULOS_DE_STATUS).map(([valor, rotulo]) => (
                    <Chip
                      key={valor}
                      ativo={filtro.situacao_da_parcela === valor}
                      onClick={() =>
                        trocar({
                          situacao_da_parcela:
                            filtro.situacao_da_parcela === valor ? undefined : (valor as StatusDaParcela),
                        })
                      }
                    >
                      {rotulo}
                    </Chip>
                  ))}
                </div>
              </fieldset>
            </div>
          </BotaoDeFiltros>

          <MenuDeExportacao
            formato={formato}
            aoTrocarFormato={aoTrocarFormato}
            aoExportar={aoExportar}
            ocupado={ocupado}
          />
        </>
      }
      nota={`${formatarData(de)} a ${formatarData(ate)}`}
    />
  )
}
