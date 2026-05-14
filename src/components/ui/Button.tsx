import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

const variants = {
  primary:   'bg-stone-900 text-white hover:bg-stone-700 active:bg-stone-800',
  secondary: 'bg-stone-100 text-stone-900 hover:bg-stone-200 active:bg-stone-300',
  ghost:     'text-stone-600 hover:bg-stone-100 active:bg-stone-200',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}
