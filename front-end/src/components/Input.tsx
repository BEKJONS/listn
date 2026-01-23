import React from 'react';
type InputProps = {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  helperText?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
};
export function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  multiline = false,
  rows = 3,
  className = ''
}: InputProps) {
  const inputStyles = `
    w-full bg-transparent border border-white/10 rounded-lg px-4 py-3
    text-white placeholder-gray-500
    focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10
    transition-all duration-200
    ${error ? 'border-red-500/50 focus:border-red-500' : ''}
  `;
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-sm text-gray-400">{label}</label>}
      {multiline ?
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`${inputStyles} resize-none`} /> :


      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputStyles} />

      }
      {helperText && !error &&
      <p className="text-xs text-gray-500">{helperText}</p>
      }
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>);

}