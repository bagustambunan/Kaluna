import type { Category } from '../../types'
import { Badge } from '../ui/Badge'

interface CategoryBadgeProps {
  category: Category | undefined
  size?: 'sm' | 'md'
}

export function CategoryBadge({ category, size }: CategoryBadgeProps) {
  if (!category) return null
  return <Badge color={category.color} emoji={category.emoji} name={category.name} size={size} />
}
