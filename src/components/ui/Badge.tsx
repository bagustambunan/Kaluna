interface BadgeProps {
  color: string
  emoji: string
  name: string
  size?: 'sm' | 'md'
}

export function Badge({ color, emoji, name, size = 'md' }: BadgeProps) {
  const sz = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-0.5'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium ${sz}`}
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span>{emoji}</span>
      <span>{name}</span>
    </span>
  )
}
