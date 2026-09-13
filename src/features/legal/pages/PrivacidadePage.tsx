import { TIPOS_DE_DOCUMENTO } from '@/config/legal'
import { PaginaDeDocumento } from '../components/PaginaDeDocumento'

export default function PrivacidadePage() {
  return <PaginaDeDocumento tipo={TIPOS_DE_DOCUMENTO.politicaDePrivacidade} />
}
