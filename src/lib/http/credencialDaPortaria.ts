import type { EventoDoConvite } from '@/types/festa'

const CHAVE = 'kapa:portaria:credencial'

/** O que o celular da portaria guarda depois de abrir o link (resposta de `/festa/portaria/acessos/ativar`). */
export interface CredencialDaPortaria {
  acesso_id: string
  nome: string
  token: string
  expira_em: string
  evento: EventoDoConvite
}

/**
 * A credencial da portaria terceirizada: quem fica na porta abre um link e o celular vira portaria de um
 * evento, sem conta no Kapa.
 *
 * Fica no armazenamento do navegador, e não só na memória como o token da sessão: ela tem de sobreviver a
 * fechar a aba e a câmera abrir o convite numa aba nova. O alcance é pequeno de propósito — um evento, até
 * o fim da janela de validação, e a Gestão corta quando quiser.
 */
export const credencialDaPortaria = {
  /** A credencial, ou `null` se não há ou se já venceu. */
  ler(): CredencialDaPortaria | null {
    try {
      const salva = JSON.parse(localStorage.getItem(CHAVE) ?? 'null') as CredencialDaPortaria | null
      return salva && new Date(salva.expira_em) > new Date() ? salva : null
    } catch {
      return null
    }
  },

  /** Só o token, para o `Authorization` do cliente HTTP. */
  token: () => credencialDaPortaria.ler()?.token ?? null,

  gravar(credencial: CredencialDaPortaria) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(credencial))
    } catch {
      // Sem armazenamento (aba anônima): a página avisa que o celular não ficou liberado.
    }
  },

  limpar() {
    try {
      localStorage.removeItem(CHAVE)
    } catch {
      // Nada a limpar.
    }
  },
}
