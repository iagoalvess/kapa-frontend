import {
  CalendarClock,
  Check,
  Clock,
  Download,
  FileText,
  FolderOpen,
  HardDrive,
  Layers,
  Megaphone,
  Paperclip,
  Pin,
  Plus,
  Star,
  Target,
  Wallet,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { Selo } from '@/components/Selo'
import { TextoEmMarkdown } from '@/components/TextoEmMarkdown'
import { Button } from '@/components/ui/button'
import { LinhaDoMural } from '@/features/comunicacao/components/LinhaDoMural'
import type { Aviso } from '@/features/comunicacao/types/comunicacao.types'
import { formatarCentavos } from '@/lib/formato'
import { BarraDaPrevia } from './ElementosDaPrevia'

const AVISOS: Aviso[] = [
  [
    'Ensaio da colação confirmado',
    'Nosso ensaio será no auditório principal. Confira os horários e as orientações para a turma.',
    true,
    true,
  ],
  [
    'Buffet contratado',
    'A comissão fechou com o Buffet Jardim. O cardápio completo já está no acervo.',
    true,
    false,
  ],
  [
    'Última semana para nomear os convidados',
    'Confira os nomes e os documentos dos seus convidados antes do fechamento da lista.',
    false,
    true,
  ],
  [
    'Reunião da comissão de outubro',
    'Vamos revisar o orçamento da festa, os contratos e o cronograma dos fornecedores.',
    false,
    false,
  ],
  [
    'Fotos da turma e entrega dos convites',
    'O encontro será no campus. Separe sua beca e confirme a presença até sexta-feira.',
    false,
    false,
  ],
  [
    'Novo orçamento de decoração',
    'Recebemos mais uma proposta de decoração para comparar os valores e os serviços.',
    false,
    false,
  ],
].map(([titulo, conteudo, fixado, destaque], indice) => ({
  id: `previa-aviso-${indice}`,
  titulo: String(titulo),
  conteudo: String(conteudo),
  fixado: Boolean(fixado),
  destaque: Boolean(destaque),
  visibilidade: indice === 3 ? 'SomenteComissao' : 'Turma',
  publicado_em: `2026-10-${String(3 - Math.floor(indice / 2)).padStart(2, '0')}T12:00:00Z`,
  atualizado_em: '2026-10-03T12:00:00Z',
  publicado_por_usuario_id: 'previa-comissao',
  autor: indice % 2 ? 'Rafael Almeida' : 'Marina Costa',
}))

const TEXTO_DO_AVISO = `O ensaio da nossa colação já tem data marcada! Este encontro vai ajudar todo mundo a conhecer a ordem da cerimônia e tirar as últimas dúvidas.

### Quando e onde
**23 de outubro, às 19h**, no auditório principal da universidade. Chegue com 15 minutos de antecedência para conferirmos a lista.

### O que vamos combinar
- Entrada dos formandos e organização das filas.
- Entrega dos diplomas e participação dos homenageados.
- Orientações para as fotos e para os familiares.

O roteiro da cerimônia e as orientações para a turma estão disponíveis em Documentos. Se tiver alguma dúvida, procure a comissão antes do ensaio.

Contamos com a presença de todos para que nossa colação aconteça com tranquilidade!`

export function PreviaDoMural() {
  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo do mural"
        indicadores={[
          { rotulo: 'Avisos publicados', valor: 18, icone: Megaphone },
          { rotulo: 'Importantes', valor: 5, icone: Star },
          { rotulo: 'Fixados', valor: 2, unidade: 'de 3', icone: Pin },
          { rotulo: 'Último aviso', valor: 'Hoje', icone: Clock },
        ]}
      />
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <FolderOpen className="size-4" />
        Documentos da turma
      </div>
      <BarraDaPrevia
        busca="Buscar aviso"
        filtros={['Fixados', 'Importantes', 'Só comissão']}
        acao="Novo aviso"
        total={18}
      />
      <div className="grid items-start gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Cartao rotulo="Avisos" className="gap-0 overflow-hidden p-0">
          <ul>
            {AVISOS.map((aviso, indice) => (
              <LinhaDoMural key={aviso.id} aviso={aviso} aberto={indice === 0} />
            ))}
          </ul>
        </Cartao>
        <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Cartao
            titulo="Ensaio da colação confirmado"
            icone={Megaphone}
            selo={<Selo tom="marca">Importante</Selo>}
            className="min-h-[40rem]"
            acao={
              <Button variant="outline" size="sm">
                Editar
              </Button>
            }
          >
            <dl className="text-muted-foreground flex flex-wrap gap-5 border-b pb-4 text-xs">
              <div>
                <dt>Publicado por</dt>
                <dd className="text-foreground mt-1">Marina Costa</dd>
              </div>
              <div>
                <dt>Publicado em</dt>
                <dd className="text-foreground mt-1">Hoje, às 9h</dd>
              </div>
              <div>
                <dt>Para quem</dt>
                <dd className="text-foreground mt-1">A turma toda</dd>
              </div>
              <div>
                <dt>No mural</dt>
                <dd className="text-foreground mt-1">Fixado no topo</dd>
              </div>
            </dl>
            <TextoEmMarkdown conteudo={TEXTO_DO_AVISO} className="max-w-prose" />
          </Cartao>
          <Cartao titulo="No acervo da turma" icone={Paperclip}>
            {['Roteiro da colação', 'Orientações para os formandos', 'Ata da última reunião'].map(
              (titulo) => (
                <div key={titulo} className="flex gap-2 border-b pb-3 last:border-0">
                  <FileText className="text-muted-foreground mt-1 size-4 shrink-0" />
                  <div className="grid gap-1">
                    <span className="text-sm font-medium">{titulo}</span>
                    <span className="text-muted-foreground text-xs">PDF · Disponível para a turma</span>
                  </div>
                </div>
              ),
            )}
          </Cartao>
        </div>
      </div>
    </>
  )
}

const GRUPOS = [
  {
    titulo: 'Atas',
    novo: 'Nova ata',
    documentos: [
      'Reunião da comissão — outubro',
      'Assembleia da turma — setembro',
      'Aprovação do orçamento',
      'Eleição da comissão',
    ],
  },
  {
    titulo: 'Contratos',
    novo: 'Novo contrato',
    documentos: [
      'Buffet Jardim — contrato',
      'Reserva do Espaço Aurora',
      'Fotografia da colação',
      'Banda Horizonte',
    ],
  },
  {
    titulo: 'Orçamentos',
    novo: 'Novo orçamento',
    documentos: [
      'Decoração — proposta revisada',
      'Som e iluminação',
      'Buffet — cardápio completo',
      'Convites e papelaria',
    ],
  },
  {
    titulo: 'Comprovantes',
    novo: 'Novo comprovante',
    documentos: [
      'Entrada do espaço da festa',
      'Pagamento da decoração',
      'Sinal da fotografia',
      'Parcela do buffet',
    ],
  },
  {
    titulo: 'Regulamentos',
    novo: 'Novo regulamento',
    documentos: [
      'Orientações para os convidados',
      'Roteiro da colação',
      'Regras da venda de convites',
      'Cronograma da formatura',
    ],
  },
  {
    titulo: 'Outros',
    novo: 'Novo documento',
    documentos: ['Lista de homenageados', 'Contato dos fornecedores', 'Identidade visual da turma'],
  },
]

export function PreviaDeDocumentos() {
  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo do acervo"
        indicadores={[
          { rotulo: 'Documentos', valor: 23, icone: FolderOpen },
          { rotulo: 'Categorias em uso', valor: 6, icone: Layers },
          { rotulo: 'Espaço ocupado', valor: '48,2 MB', icone: HardDrive },
          { rotulo: 'Mais recente', valor: 'Hoje', icone: Clock },
        ]}
      />
      <BarraDaPrevia
        busca="Buscar documento"
        filtros={['Da turma', 'Só da comissão', 'PDF', 'Mais recentes']}
        acao="Adicionar documento"
        total={23}
      />
      <div className="rolagem-discreta flex min-w-0 items-start gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-5 xl:overflow-visible">
        {GRUPOS.map((grupo) => (
          <section
            key={grupo.titulo}
            className="bg-muted grid w-72 shrink-0 content-start gap-3 rounded-3xl p-3 xl:w-auto xl:min-w-0"
          >
            <header className="flex items-center gap-2 px-1">
              <h2 className="truncate font-medium">{grupo.titulo}</h2>
              <span className="bg-border text-muted-foreground rounded-full px-1.5 text-xs">
                {grupo.documentos.length}
              </span>
              <span className="text-muted-foreground ml-auto text-xs">03/10</span>
            </header>
            {grupo.documentos.map((titulo, indice) => (
              <article key={titulo} className="bg-card shadow-cartao grid gap-3 rounded-2xl p-3">
                <div className="flex items-start gap-2.5">
                  <Avatar nome="Marina Costa" semente="previa-comissao" className="size-7 shrink-0" />
                  <div className="grid min-w-0 gap-1">
                    <p className="line-clamp-2 text-sm leading-snug font-medium">{titulo}</p>
                    <p className="text-muted-foreground text-xs">
                      {indice % 2 ? 'Rafael Almeida' : 'Marina Costa'}
                    </p>
                  </div>
                </div>
                <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
                  <Selo tom="cinza">PDF</Selo>
                  <span>{indice + 1},2 MB</span>
                  <span>Versão {indice === 0 ? 2 : 1}</span>
                </div>
                <div className="text-muted-foreground flex items-center justify-between border-t pt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Há {indice + 1} dias
                  </span>
                  <Download className="size-4" />
                </div>
              </article>
            ))}
            <Button variant="ghost" size="sm">
              <Plus />
              {grupo.novo}
            </Button>
          </section>
        ))}
      </div>
    </>
  )
}

const ITENS_DA_FESTA = [
  { titulo: 'Buffet e jantar', fornecedor: 'Buffet Jardim', valor: 6200000, situacao: 'Contratado' },
  { titulo: 'Espaço da festa', fornecedor: 'Espaço Aurora', valor: 4800000, situacao: 'Contratado' },
  { titulo: 'Decoração', fornecedor: 'Ateliê das Flores', valor: 2800000, situacao: 'Em cotação' },
  { titulo: 'Som e iluminação', fornecedor: 'Luz & Som Eventos', valor: 2200000, situacao: 'Em cotação' },
  { titulo: 'Banda e DJ', fornecedor: 'Banda Horizonte', valor: 2000000, situacao: 'Em cotação' },
  {
    titulo: 'Fotografia e filmagem',
    fornecedor: 'Memória Fotografia',
    valor: 1600000,
    situacao: 'Contratado',
  },
  { titulo: 'Convites e papelaria', fornecedor: 'Papel & Festa', valor: 1000000, situacao: 'Em cotação' },
]

export function PreviaDoOrcamento() {
  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo da festa"
        indicadores={[
          { rotulo: 'Custo da festa', valor: formatarCentavos(20600000), icone: Target },
          { rotulo: 'Arrecadado', valor: formatarCentavos(18430000), nota: '89% da meta', icone: Wallet },
          { rotulo: 'Falta juntar', valor: formatarCentavos(2170000), icone: CalendarClock },
          { rotulo: 'Já pago aos fornecedores', valor: formatarCentavos(6192000), icone: Check },
        ]}
      />
      <BarraDaPrevia
        busca="Buscar item da festa"
        filtros={['Em cotação', 'Contratados']}
        acao="Novo item"
        total={7}
      />
      <div className="grid items-start gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Cartao rotulo="Itens da festa" className="gap-0 overflow-hidden p-0">
          {ITENS_DA_FESTA.map((item, indice) => (
            <div
              key={item.titulo}
              className={`grid gap-2 border-b px-4 py-4 last:border-0 ${indice === 0 ? 'bg-brand-tint border-l-brand border-l-2' : ''}`}
            >
              <div className="flex justify-between gap-2">
                <h3 className="text-sm font-medium">{item.titulo}</h3>
                <span className="text-sm tabular-nums">{formatarCentavos(item.valor)}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">{item.fornecedor}</span>
                <Selo tom={item.situacao === 'Contratado' ? 'sucesso' : 'cinza'}>{item.situacao}</Selo>
              </div>
            </div>
          ))}
        </Cartao>
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Cartao
            titulo="Buffet e jantar"
            icone={FileText}
            selo={<Selo tom="sucesso">Contratado</Selo>}
            className="min-h-[36rem]"
            acao={
              <Button variant="outline" size="sm">
                Editar item
              </Button>
            }
          >
            <TextoDoCartao>
              Jantar completo para os formandos e convidados, com opções vegetarianas, sobremesas e serviço de
              bebidas durante a festa.
            </TextoDoCartao>
            <dl className="grid grid-cols-2 gap-5 border-y py-5 text-sm">
              <div>
                <dt className="text-muted-foreground">Fornecedor escolhido</dt>
                <dd className="mt-1 font-medium">Buffet Jardim</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Valor contratado</dt>
                <dd className="mt-1 font-medium">{formatarCentavos(6200000)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pago até agora</dt>
                <dd className="mt-1 font-medium">{formatarCentavos(1860000)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ainda falta pagar</dt>
                <dd className="mt-1 font-medium">{formatarCentavos(4340000)}</dd>
              </div>
            </dl>
            <h3 className="font-medium">Propostas recebidas</h3>
            {[
              ['Buffet Jardim', 6200000, 'Escolhida'],
              ['Sabores da Serra', 6750000, 'Levantada'],
              ['Mesa & Celebração', 6980000, 'Levantada'],
            ].map(([nome, valor, situacao]) => (
              <div key={nome} className="flex items-center justify-between gap-3 border-b pb-4">
                <div className="grid gap-1">
                  <p className="text-sm font-medium">{nome}</p>
                  <span className="text-muted-foreground text-xs">{situacao}</span>
                </div>
                <span className="text-sm tabular-nums">{formatarCentavos(Number(valor))}</span>
              </div>
            ))}
          </Cartao>
          <Cartao titulo="Meta da festa" icone={Target}>
            <span className="text-2xl font-semibold">89%</span>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div className="bg-brand h-full w-[89%] rounded-full" />
            </div>
            <TextoDoCartao>
              Já temos {formatarCentavos(18430000)} dos {formatarCentavos(20600000)} necessários.
            </TextoDoCartao>
            <p className="border-t pt-4 text-sm">7 itens no orçamento · 3 fornecedores contratados</p>
          </Cartao>
        </div>
      </div>
    </>
  )
}
