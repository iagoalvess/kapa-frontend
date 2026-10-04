import { cn } from '@/lib/utils'

/** Um fio laranja irregular, inspirado nos rabiscos da landing, para separar os blocos do Início. */
export function TracoDoInicio({
  className,
  verticalNoDesktop = false,
}: {
  className?: string
  verticalNoDesktop?: boolean
}) {
  return (
    <div aria-hidden className={cn('text-brand/50 pointer-events-none', className)}>
      <svg
        viewBox="0 0 1000 28"
        preserveAspectRatio="none"
        className={cn('h-full w-full', verticalNoDesktop && 'lg:hidden')}
      >
        <path
          d="M4 17C124 7 214 22 338 14C442 7 472 9 500 16C562 26 651 6 776 13C868 18 938 10 996 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M393 20C430 10 466 14 491 18M509 18C536 14 570 10 607 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.65"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {verticalNoDesktop ? (
        <svg viewBox="0 0 28 1000" preserveAspectRatio="none" className="hidden h-full w-full lg:block">
          <path
            d="M17 4C7 124 22 214 14 338C7 442 9 472 16 500C26 562 6 651 13 776C18 868 10 938 14 996"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M20 393C10 430 14 466 18 491M18 509C14 536 10 570 20 607"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.65"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}
    </div>
  )
}
