import React from 'react'

type BaseProps = React.HTMLAttributes<HTMLDivElement> & { style?: React.CSSProperties; children?: React.ReactNode }

export const Layout = ({ children, style, ...rest }: BaseProps) => <div {...rest} style={{ display: 'flex', minHeight: '100vh', ...style }}>{children}</div>
Layout.Header = ({ children, style, ...rest }: BaseProps) => <header {...rest} style={{ padding: 12, borderBottom: '1px solid var(--border)', ...style }}>{children}</header>
Layout.Sider = ({ children, style, ...rest }: BaseProps) => <aside {...rest} style={{ width: 260, borderRight: '1px solid var(--border)', padding: 12, ...style }}>{children}</aside>
Layout.Content = ({ children, style, ...rest }: BaseProps) => <main {...rest} style={{ flex: 1, padding: 16, ...style }}>{children}</main>

export const Card = ({ children, style, ...rest }: BaseProps) => (
  <div {...rest} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, ...style }}>{children}</div>
)

export const Button = ({ children, style, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} style={{ border: '1px solid var(--border)', background: '#fff', borderRadius: 8, padding: '6px 10px', ...style }}>
    {children}
  </button>
)

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', width: '100%', ...(props.style ?? {}) }} />
)

export const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', width: '100%', ...(props.style ?? {}) }}>
    {children}
  </select>
)

export const Space = ({ children, style, ...rest }: BaseProps) => <div {...rest} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', ...style }}>{children}</div>

export const Typography = {
  Title: ({ children, style, ...rest }: BaseProps) => <h2 {...rest} style={{ margin: 0, ...style }}>{children}</h2>,
  Text: ({ children, style, ...rest }: BaseProps) => <span {...rest} style={style}>{children}</span>,
}
