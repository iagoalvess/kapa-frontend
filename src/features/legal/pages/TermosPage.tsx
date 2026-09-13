import { TIPOS_DE_DOCUMENTO } from '@/config/legal'
import { PaginaDeDocumento } from '../components/PaginaDeDocumento'

export default function TermosPage() {
  return <PaginaDeDocumento tipo={TIPOS_DE_DOCUMENTO.termosDeUso} />
}
