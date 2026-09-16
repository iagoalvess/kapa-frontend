import { CircleSlash, Handshake, IdCard, Mail, NotebookPen, Receipt, Phone, Tag, Wallet } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Link, useParams } from 'react-router'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { Cartao } from '@/components/Cartao'
import {
  EsqueletoDeCartao,
  EsqueletoDeCartoes,
  EsqueletoDeDados,
  EsqueletoDeTabela,
} from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { formatarCentavos, formatarData, formatarNumero, formatarTelefone } from '@/lib/formato'
import { DialogoDeFornecedor } from '../components/DialogoDeFornecedor'
import { SituacaoDaDespesa } from '../components/LinhaDeDespesa'
import { useDespesas } from '../hooks/useDespesas'
import { useFornecedor } from '../hooks/useFornecedores'
import {
  formatarDocumento,
  type Fornecedor,
  ROTULOS_DE_CATEGORIA,
  rotuloDaDespesa,
} from '../types/financeiro.types'

const TAMANHO_DA_PAGINA = 50

/**
 * O cadastro de um fornecedor, como o cadastro de um membro: o que se sabe dele em cima e, embaixo,
 * tudo o que a turma já lançou no nome dele.
 *
 * A lista de despesas é a mesma da tela de Despesas, filtrada por ele — sem paginação à vista:
 * fornecedor com mais de cinquenta lançamentos se olha lá, pelo filtro.
 */
export default function DetalheDoFornecedorPage() {
  const { id = '' } = useParams()
  const fornecedor = useFornecedor(id)
  const [editando, definirEditando] = useState(false)
  const editavel = useEscritaLiberada()

  const voltar = <LinkDeVolta para={ROTAS.fornecedores}>Fornecedores</LinkDeVolta>

  // O "voltar" fica: ele não depende da consulta, e some-lo faria a tela saltar quando ela voltar.
  if (fornecedor.isPending)
    return (
      <>
        {voltar}
        <EsqueletoDeCartoes quantidade={1} altura="h-32" className="md:grid-cols-1" />
        <EsqueletoDeCartao>
          <EsqueletoDeDados linhas={4} />
        </EsqueletoDeCartao>
      </>
    )

  if (fornecedor.isError)
    return (
      <>
        {voltar}
        <ErroDaConsulta erro={fornecedor.error} />
      </>
    )

  const dados = fornecedor.data

  return (
    <>
      {voltar}

      <FaixaDeIndicadores
        rotulo="Resumo do fornecedor"
        indicadores={[
          { rotulo: 'Pago', valor: formatarCentavos(dados.pago_em_centavos), icone: Wallet },
          {
            rotulo: 'Ainda a pagar',
            valor: formatarCentavos(dados.previsto_em_centavos),
            icone: Wallet,
            sinal: dados.previsto_em_centavos > 0 ? { texto: 'em aberto', tom: 'negativo' } : undefined,
          },
          { rotulo: 'Despesas', valor: dados.quantidade_de_despesas, icone: Receipt },
          {
            rotulo: 'Categoria',
            valor: ROTULOS_DE_CATEGORIA[dados.categoria],
            icone: Tag,
          },
        ]}
      />

      <Cartao
        titulo={dados.nome}
        icone={Handshake}
        selo={dados.ativo ? null : <Selo tom="neutro">Inativo</Selo>}
        descricao={
          dados.ativo
            ? 'Aparece ao lançar uma despesa, já com a categoria escolhida.'
            : 'Aposentado: não aparece mais ao lançar uma despesa. O histórico continua aqui.'
        }
        acao={
          <Button variant="outline" size="sm" disabled={!editavel} onClick={() => definirEditando(true)}>
            Editar
          </Button>
        }
      >
        <ListaDeDados>
          <Dado icone={IdCard} rotulo="CNPJ ou CPF">
            {dados.documento ? formatarDocumento(dados.documento) : <Vazio>Sem documento</Vazio>}
          </Dado>
          <Dado icone={Phone} rotulo="Telefone">
            {dados.telefone ? formatarTelefone(dados.telefone) : <Vazio>Sem telefone</Vazio>}
          </Dado>
          <Dado icone={Mail} rotulo="E-mail">
            {dados.email ?? <Vazio>Sem e-mail</Vazio>}
          </Dado>
          <Dado icone={CircleSlash} rotulo="Situação">
            {dados.ativo ? 'Ativo' : 'Inativo'}
          </Dado>
          {dados.observacoes ? (
            <Dado icone={NotebookPen} rotulo="Observações">
              {dados.observacoes}
            </Dado>
          ) : null}
        </ListaDeDados>
      </Cartao>

      <DespesasDoFornecedor fornecedor={dados} />

      <DialogoDeFornecedor
        aberto={editando ? { fornecedor: dados } : false}
        aoFechar={() => definirEditando(false)}
      />
    </>
  )
}

/** O que a turma já lançou no nome dele, na mesma tabela da tela de Despesas. */
function DespesasDoFornecedor({ fornecedor }: { fornecedor: Fornecedor }) {
  const despesas = useDespesas({ fornecedor_id: fornecedor.id, tamanho: TAMANHO_DA_PAGINA })
  const itens = despesas.data?.itens ?? []

  return (
    <Cartao
      titulo="Despesas do fornecedor"
      icone={Receipt}
      descricao={
        despesas.data
          ? `${formatarNumero(despesas.data.total)} ${despesas.data.total === 1 ? 'lançamento' : 'lançamentos'} no nome dele.`
          : undefined
      }
      acao={
        <Button asChild variant="outline" size="sm">
          <Link to={`${ROTAS.despesas}?busca=${encodeURIComponent(fornecedor.nome)}`}>Ver em Despesas</Link>
        </Button>
      }
    >
      {despesas.isPending ? <EsqueletoDeTabela linhas={4} colunas={5} /> : null}

      {despesas.isError ? <ErroDaConsulta erro={despesas.error} /> : null}

      {despesas.data && itens.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhuma despesa lançada para ele ainda — por isso o cadastro ainda pode ser excluído.
        </p>
      ) : null}

      {itens.length > 0 ? (
        <Tabela
          cabecalho={
            <>
              <th className="py-3 pr-4 font-normal">Despesa</th>
              <th className="py-3 pr-4 font-normal">Vencimento</th>
              <th className="py-3 pr-4 text-right font-normal">Valor</th>
              <th className="py-3 font-normal">Situação</th>
            </>
          }
        >
          {itens.map((despesa) => (
            <tr key={despesa.id} className="border-b last:border-0">
              <td className="text-foreground py-3 pr-4">{rotuloDaDespesa(despesa)}</td>
              <td className="text-muted-foreground py-3 pr-4 whitespace-nowrap">
                {formatarData(despesa.vencimento)}
              </td>
              <td className="py-3 pr-4 text-right whitespace-nowrap">
                {formatarCentavos(despesa.valor_em_centavos)}
              </td>
              <td className="py-3">
                <SituacaoDaDespesa despesa={despesa} />
              </td>
            </tr>
          ))}
        </Tabela>
      ) : null}
    </Cartao>
  )
}

const Vazio = ({ children }: { children: ReactNode }) => <span className="text-texto-muted">{children}</span>
