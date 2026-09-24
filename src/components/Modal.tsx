import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import styled from 'styled-components';
import { VisuallyHidden } from '../styles';

const Sheet = styled.dialog<{ $visible: boolean; $wide: boolean; $compact: boolean }>`
  width: min(${({ $wide, $compact }) => $compact ? '440px' : $wide ? '740px' : '640px'}, calc(100vw - 32px));
  max-height: calc(100dvh - 48px);
  padding: ${({ $compact }) => $compact ? '20px' : '32px'};
  border: 1px solid var(--line);
  border-radius: 20px;
  color: var(--ink);
  background: var(--surface);
  box-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
  overflow-y: auto;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transform: scale(${({ $visible }) => $visible ? '1' : '0.96'}) translateY(${({ $visible }) => $visible ? '0' : '10px'});
  transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
  
  &::backdrop {
    background: var(--backdrop);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  @media (max-width: 500px) {
    width: calc(100vw - 20px);
    max-height: calc(100dvh - max(20px, env(safe-area-inset-top)) - max(20px, env(safe-area-inset-bottom)));
    padding: ${({ $compact }) => $compact ? '16px' : '24px 18px'};
    border-radius: 18px;
  }
`;

export function Modal({ open, onClose, title, children, wide = false, compact = false }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; compact?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const dialog = ref.current!;
    if (open) {
      if (!dialog.open) dialog.showModal();
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timeout = setTimeout(() => dialog.close(), 180);
    return () => clearTimeout(timeout);
  }, [open]);
  return <Sheet ref={ref} $wide={wide} $compact={compact} $visible={visible} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => {
    if (e.target === e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose();
    }
  }}>
    <VisuallyHidden id={titleId}>{title}</VisuallyHidden>
    {children}
  </Sheet>;
}
