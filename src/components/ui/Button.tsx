import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

const variants = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-[0_8px_20px_rgba(47,111,228,.18)]',
  secondary: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-950 active:bg-blue-200',
  ghost:     'text-[#6680a4] dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 active:bg-blue-100',
  danger:    'bg-[#ec6b62] text-white hover:bg-[#d95a53] active:bg-red-700',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 font-bold rounded-xl transition-all active:scale-[.98] disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}
