import styled, { createGlobalStyle, css } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  @property --task-progress { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
  @font-face { font-family: 'Sohne'; src: url('/fonts/sohne-variable.woff2') format('woff2'); font-weight: 100 900; font-style: normal; font-display: swap; }
  @font-face { font-family: 'Sohne'; src: url('/fonts/sohne-italic.woff2') format('woff2'); font-weight: 400; font-style: italic; font-display: swap; }

  :root {
    color-scheme: light;
    --paper: #f8fafc;
    --surface: #ffffff;
    --surface-elevated: #ffffff;
    --field: #ffffff;
    --ink: #0f172a;
    --muted: #64748b;
    --line: #e2e8f0;
    --line-subtle: #f1f5f9;
    --sage: #475569;
    --soft: #f1f5f9;
    --date-bg: #e2e8f0;
    --tag-bg: #eef2ff;
    --tag-ink: #4f46e5;
    --tag-selected: #4f46e5;
    --code-bg: #f1f5f9;
    --code-ink: #0f172a;
    --quote: #64748b;
    --selection: #c7d2fe;
    --focus: #6366f1;
    --link: #4f46e5;
    --url: #7c3aed;
    --checkbox: #94a3b8;
    --scrollbar: #cbd5e1;
    --timer-ring: #cbd5e1;
    --timer: #1e293b;
    --timer-hover: #334155;
    --timer-ink: #ffffff;
    --timer-running: #4f46e5;
    --timer-running-hover: #4338ca;
    --timer-running-ring: #818cf8;
    --page-paper: var(--paper);
    --page-focus-paper: #f1f5f9;
    --chrome-opacity: 1;
    --focus-chrome-opacity: .85;
    --primary: #4f46e5;
    --primary-hover: #4338ca;
    --primary-ink: #ffffff;
    --danger: #ef4444;
    --backdrop: rgba(15, 23, 42, 0.4);
    --chart: #cbd5e1;
    --chart-today: #4f46e5;
    --chart-hover: #6366f1;
    --card-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02);
    --card-shadow-hover: 0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03);
    --glow: rgba(79, 70, 229, 0.15);
  }

  :root[data-theme='night'] {
    color-scheme: dark;
    --paper: #0b0f19;
    --surface: #111827;
    --surface-elevated: #1a2234;
    --field: #131b2e;
    --ink: #f8fafc;
    --muted: #94a3b8;
    --line: #1e293b;
    --line-subtle: #172033;
    --sage: #cbd5e1;
    --soft: #1e293b;
    --date-bg: #1e293b;
    --tag-bg: #132337;
    --tag-ink: #38bdf8;
    --tag-selected: #38bdf8;
    --code-bg: #172033;
    --code-ink: #e2e8f0;
    --quote: #94a3b8;
    --selection: #1e3a8a;
    --focus: #38bdf8;
    --link: #38bdf8;
    --url: #c084fc;
    --checkbox: #475569;
    --scrollbar: #334155;
    --timer-ring: #334155;
    --timer: #1e293b;
    --timer-hover: #293548;
    --timer-ink: #f8fafc;
    --timer-running: #0d9488;
    --timer-running-hover: #0f766e;
    --timer-running-ring: #2dd4bf;
    --page-paper: var(--paper);
    --page-focus-paper: #070a12;
    --chrome-opacity: 1;
    --focus-chrome-opacity: .9;
    --primary: #38bdf8;
    --primary-hover: #7dd3fc;
    --primary-ink: #0b0f19;
    --danger: #f87171;
    --backdrop: rgba(0, 0, 0, 0.65);
    --chart: #1e293b;
    --chart-today: #38bdf8;
    --chart-hover: #7dd3fc;
    --card-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
    --card-shadow-hover: 0 10px 30px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.2);
    --glow: rgba(56, 189, 248, 0.2);
  }

  * { box-sizing: border-box; }
  html {
    background: var(--paper);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    scroll-behavior: smooth;
  }
  body {
    margin: 0;
    color: var(--ink);
    background: var(--paper);
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    transition: background-color 200ms ease, color 200ms ease;
  }
  body:has(dialog[open]) { overflow: hidden; }
  button, input, textarea, select { font: inherit; color: inherit; }
  button { -webkit-tap-highlight-color: transparent; }
  button:not(:disabled), summary { cursor: pointer; }
  button:disabled { cursor: wait; opacity: .5; }
  :focus, :focus-visible { outline: none; }
  ::selection { background: var(--selection); }
  h1, h2, h3, p { margin: 0; }
  h1, h2, h3 { text-wrap: balance; font-weight: 600; letter-spacing: -0.02em; }
  p, li { text-wrap: pretty; }
  svg { flex-shrink: 0; stroke-width: 1.75; }
  a { color: inherit; }

  /* Custom Sleek Scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: var(--scrollbar);
    border-radius: 999px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--muted);
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: .01ms !important;
      transition-duration: .01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

export const press = css`
  transition: transform 140ms cubic-bezier(0.16, 1, 0.3, 1),
              background-color 140ms ease-out,
              color 140ms ease-out,
              box-shadow 140ms ease-out;
  &:active:not(:disabled) { transform: scale(0.96); }
`;

export const IconButton = styled.button`
  ${press};
  width: 38px;
  height: 38px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--muted);
  flex-shrink: 0;
  &:hover {
    background: var(--soft);
    color: var(--ink);
    border-color: var(--line);
  }
`;

export const Button = styled.button<{ $primary?: boolean }>`
  ${press};
  min-height: 40px;
  padding: 8px 18px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border: 1px solid ${({ $primary }) => $primary ? 'transparent' : 'var(--line)'};
  border-radius: 10px;
  background: ${({ $primary }) => $primary ? 'var(--primary)' : 'var(--surface)'};
  color: ${({ $primary }) => $primary ? 'var(--primary-ink)' : 'var(--ink)'};
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  &:hover {
    background: ${({ $primary }) => $primary ? 'var(--primary-hover)' : 'var(--soft)'};
  }
`;

export const TextButton = styled.button`
  ${press};
  min-height: 36px;
  border: 0;
  background: transparent;
  color: var(--sage);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  &:hover {
    background: var(--soft);
    color: var(--ink);
  }
`;

export const Eyebrow = styled.span`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--muted);
`;

export const Muted = styled.p`
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
`;

export const Field = styled.input`
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 14px;
  background: var(--field);
  color: var(--ink);
  font-size: 14px;
  min-width: 0;
  transition: border-color 150ms ease, box-shadow 150ms ease;
  &:focus {
    border-color: var(--focus);
    box-shadow: 0 0 0 3px var(--glow);
  }
`;

export const FieldLabel = styled.label`
  display: grid;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
`;

export const InlineError = styled.p`
  font-size: 13px;
  color: var(--danger);
  margin: 10px 0;
  font-weight: 500;
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
