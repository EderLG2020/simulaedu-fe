/** Une clases condicionales: cn('a', cond && 'b', undefined) -> 'a b'. */
export function cn(...clases: (string | false | null | undefined)[]): string {
  return clases.filter(Boolean).join(' ')
}
