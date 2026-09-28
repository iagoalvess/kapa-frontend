import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { ROTAS } from '@/config/rotas'

/**
 * A casca das páginas públicas de leitura — termos, política, operadores: o logo no topo, que volta
 * à página institucional, e uma coluna de texto no meio. Mora no site (Sprint 33), como elas.
 *
 * Sem menu nem sessão: é lida antes do cadastro, muitas vezes numa aba aberta pelo formulário.
 *
 * @param children O conteúdo da coluna.
 */
export function LayoutDePaginaPublica({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card min-h-full">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-6">
          <Link to={ROTAS.landing} aria-label="Kapa — página inicial">
            <LogoKapa className="h-7" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </div>
  )
}
