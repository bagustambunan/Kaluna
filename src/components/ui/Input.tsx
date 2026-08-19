import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`w-full px-3 py-2 text-ink bg-sheet border rounded-md text-sm placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-pen focus:border-transparent ${error ? 'border-stamp' : 'border-ink/15'} ${className}`}
      />
      {error && <p className="text-xs text-stamp">{error}</p>}
    </div>
  )
}
