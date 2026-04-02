import type { CSSProperties } from 'react'

const base: CSSProperties = { width: 14, height: 14, display: 'block' }

export const HomeIcon = () => <svg viewBox="0 0 24 24" style={base}><path fill="currentColor" d="M12 3 2 11h3v10h6v-6h2v6h6V11h3z"/></svg>
export const PipelineIcon = () => <svg viewBox="0 0 24 24" style={base}><path fill="currentColor" d="M4 6h16v4H4zm0 8h10v4H4z"/></svg>
export const ClusterIcon = () => <svg viewBox="0 0 24 24" style={base}><circle cx="7" cy="7" r="3" fill="currentColor"/><circle cx="17" cy="7" r="3" fill="currentColor"/><circle cx="12" cy="17" r="3" fill="currentColor"/></svg>
export const GlobeIcon = () => <svg viewBox="0 0 24 24" style={base}><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m7.9 9h-3.1a15 15 0 0 0-1-5 8 8 0 0 1 4.1 5M12 4.1c.8 1.1 1.5 3 1.8 5h-3.6c.3-2 .9-3.9 1.8-5m-3.8 7h7.6a16 16 0 0 1 0 2h-7.6a16 16 0 0 1 0-2m-3.1 0a8 8 0 0 1 4.1-5 15 15 0 0 0-1 5zm4.1 7a8 8 0 0 1-4.1-5h3.1a15 15 0 0 0 1 5m2.8 1.8c-.8-1.1-1.5-3-1.8-5h3.6c-.3 2-.9 3.9-1.8 5m3.8-1.8a15 15 0 0 0 1-5h3.1a8 8 0 0 1-4.1 5"/></svg>
export const ThemeIcon = () => <svg viewBox="0 0 24 24" style={base}><path fill="currentColor" d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9"/></svg>
