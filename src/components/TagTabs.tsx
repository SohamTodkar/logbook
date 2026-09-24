import { useState, type ReactNode } from 'react';
import styled from 'styled-components';
import { Hash, Sparkles, X, Layers } from 'lucide-react';
import type { Tag } from '../JournalContext';

const Backdrop = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 45;
  background: var(--backdrop);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: ${({ $open }) => $open ? 1 : 0};
  visibility: ${({ $open }) => $open ? 'visible' : 'hidden'};
  pointer-events: ${({ $open }) => $open ? 'auto' : 'none'};
  transition: opacity 200ms cubic-bezier(0.16, 1, 0.3, 1), visibility 200ms;
  body:has(dialog[open]) & { display: none; }
`;

const Drawer = styled.aside<{ $open: boolean }>`
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 46;
  width: min(320px, calc(100vw - 40px));
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--line);
  box-shadow: 10px 0 40px -10px rgba(0, 0, 0, 0.25);
  transform: translateX(${({ $open }) => $open ? '0' : '-100%'});
  transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
  padding: 24px;
  overflow-y: auto;
  body:has(dialog[open]) & { display: none; }
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--ink);
  }

  .logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: var(--primary);
    color: var(--primary-ink);
  }
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 120ms ease;

  &:hover {
    background: var(--soft);
    color: var(--ink);
  }
`;

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--muted);
  margin-bottom: 12px;
`;

const TagCollection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
`;

const TagRow = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${({ $selected }) => $selected ? 'var(--tag-selected)' : 'transparent'};
  border-radius: 10px;
  background: ${({ $selected }) => $selected ? 'var(--tag-bg)' : 'transparent'};
  color: ${({ $selected }) => $selected ? 'var(--tag-selected)' : 'var(--ink)'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;

  .label-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .count {
    font-size: 12px;
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--soft);
    color: var(--muted);
  }

  &:hover {
    background: ${({ $selected }) => $selected ? 'var(--tag-bg)' : 'var(--soft)'};
  }
`;

const DrawerFooter = styled.div`
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export function TagTabs({
  tags, active, onSelect, controls, isOpen, onToggle
}: {
  tags: Tag[];
  active: string | null;
  onSelect: (tag: string | null) => void;
  controls?: ReactNode;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onToggle) onToggle(value);
    setInternalOpen(value);
  };

  const select = (tag: string | null) => {
    setOpen(false);
    onSelect(tag);
  };

  return (
    <>
      <Backdrop $open={open} aria-hidden={!open} onClick={() => setOpen(false)} data-testid="tag-backdrop" />
      <Drawer $open={open} aria-label="Tags Drawer" data-open={open} data-focus-surface>
        <DrawerHeader>
          <div className="brand">
            <div className="logo-icon">
              <Sparkles size={18} />
            </div>
            <span>Logbook</span>
          </div>
          <CloseButton type="button" aria-label="Close sidebar" onClick={() => setOpen(false)}>
            <X size={16} />
          </CloseButton>
        </DrawerHeader>

        <SectionLabel>
          <Layers size={13} />
          <span>Views & Topics</span>
        </SectionLabel>

        <TagCollection>
          <TagRow
            type="button"
            $selected={active === null}
            aria-pressed={active === null}
            onClick={() => select(null)}
          >
            <div className="label-group">
              <Sparkles size={15} style={{ opacity: 0.7 }} />
              <span>All Entries</span>
            </div>
          </TagRow>

          {tags.map(tag => (
            <TagRow
              key={tag.name}
              type="button"
              $selected={tag.name === active}
              aria-pressed={tag.name === active}
              onClick={() => select(tag.name)}
            >
              <div className="label-group">
                <Hash size={14} style={{ opacity: 0.6 }} />
                <span>{tag.name}</span>
              </div>
            </TagRow>
          ))}
        </TagCollection>

        <DrawerFooter>
          {controls}
        </DrawerFooter>
      </Drawer>
    </>
  );
}
