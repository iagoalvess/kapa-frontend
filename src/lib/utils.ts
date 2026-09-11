import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Junta classes condicionais resolvendo conflito do Tailwind — a última vence.
 *
 * `cn('p-2', condicao && 'p-4')` devolve `p-4`, e não as duas.
 */
export function cn(...entradas: ClassValue[]) {
  return twMerge(clsx(entradas))
}
