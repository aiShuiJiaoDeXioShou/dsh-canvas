/** Pure label formatter for variant set chips in the Components panel. */

export interface VariantSetLike {
  name?: string
  properties?: Array<{ name: string; values?: string[] }>
}

export interface VariantComponentLike {
  name?: string
  variantProps?: Record<string, string>
}

export function variantChipLabel(set: VariantSetLike | null | undefined, component: VariantComponentLike | null | undefined): string {
  const props = component?.variantProps && typeof component.variantProps === 'object' ? component.variantProps : null
  if (props) {
    const ordered = (set?.properties ?? [])
      .map((property) => props[property.name])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    if (ordered.length > 0) return ordered.join(' / ')
    const fallbackValues = Object.values(props).filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    )
    if (fallbackValues.length > 0) return fallbackValues.join(' / ')
  }
  const rawName = String(component?.name ?? '').trim()
  const prefix = set?.name ? `${set.name}/` : ''
  if (prefix && rawName.startsWith(prefix)) {
    const short = rawName.slice(prefix.length).trim()
    if (short) return short
  }
  const tail = rawName.split('/').pop()?.trim()
  return tail || rawName || 'Variant'
}
