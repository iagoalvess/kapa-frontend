import { Selo, type TomDoSelo } from '@/components/Selo'
import { ehOpcao } from '@/lib/opcao'
import { APARENCIA_DA_ASSINATURA } from '@/types/assinatura'

/** O rótulo e a cor de cada status de formatura no painel. */
const TURMA = {
  Ativa: { rotulo: 'Ativa', tom: 'sucesso' },
  Suspensa: { rotulo: 'Suspensa', tom: 'perigo' },
  Encerrada: { rotulo: 'Encerrada', tom: 'neutro' },
  Descartada: { rotulo: 'Descartada', tom: 'neutro' },
} as const satisfies Record<string, { rotulo: string; tom: TomDoSelo }>

/**
 * As licenças que o painel agrupa: o gratuito, os planos pagos e as turmas paradas. Plano novo no catálogo
 * aparece com o próprio nome e a cor da marca, sem precisar entrar aqui.
 */
export const LICENCAS = {
  Gratuito: { rotulo: 'Gratuito', tom: 'cinza' },
  Suspensa: { rotulo: 'Suspensa', tom: 'perigo' },
  Encerrada: { rotulo: 'Encerrada', tom: 'neutro' },
  Descartada: { rotulo: 'Descartada', tom: 'neutro' },
} as const satisfies Record<string, { rotulo: string; tom: TomDoSelo }>

/** As licenças dos chips da lista de turmas, na ordem do funil: grátis, pagas, paradas. */
export const LICENCAS_DO_FILTRO = ['Gratuito', 'Essencial', 'Premium', 'Suspensa', 'Encerrada'] as const

/** O status da formatura, no vocabulário do produto. */
export function SeloDaTurma({ status }: { status: string }) {
  const item = ehOpcao(status, TURMA) ? TURMA[status] : null

  return <Selo tom={item?.tom ?? 'neutro'}>{item?.rotulo ?? status}</Selo>
}

/** A licença da turma: o plano em vigor, ou o status da turma parada. */
export function SeloDaLicenca({ licenca }: { licenca: string }) {
  const item = ehOpcao(licenca, LICENCAS) ? LICENCAS[licenca] : null

  return <Selo tom={item?.tom ?? 'marca'}>{item?.rotulo ?? licenca}</Selo>
}

/** O status da assinatura — o mesmo nome e a mesma cor da tela da assinatura. */
export function SeloDaAssinatura({ status }: { status: string }) {
  const item = ehOpcao(status, APARENCIA_DA_ASSINATURA) ? APARENCIA_DA_ASSINATURA[status] : null

  return <Selo tom={item?.tom ?? 'neutro'}>{item?.rotulo ?? status}</Selo>
}
