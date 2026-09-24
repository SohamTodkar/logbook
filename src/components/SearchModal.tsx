import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Search as SearchIcon, ArrowDown, ArrowUp, CornerDownLeft } from 'lucide-react';
import { api, errorMessage } from '../api';
import { markdownText } from '../markdown';
import type { OutlineItem } from '../types';
import { Modal } from './Modal';
import { InlineError, TextButton } from '../styles';

export type SearchHit = OutlineItem & { kind: 'notes' | 'tasks'; date: string | null };
type Results = { results: SearchHit[]; next_offset: number | null };

const SearchHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 12px;
  margin-bottom: 14px;
  color: var(--muted);
  &:focus-within {
    border-color: var(--focus);
    box-shadow: 0 0 0 3px var(--glow);
    color: var(--focus);
  }
`;

const Input = styled.input`
  width: 100%;
  min-height: 28px;
  border: 0;
  background: transparent;
  color: var(--ink);
  outline: none;
  font-size: 15px;
  font-weight: 500;
  &::placeholder {
    color: var(--muted);
    font-weight: 400;
  }
`;

const ResultsList = styled.div`
  max-height: 52dvh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 2px;
`;

const Result = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${({ $selected }) => $selected ? 'var(--line)' : 'transparent'};
  background: ${({ $selected }) => $selected ? 'var(--soft)' : 'transparent'};
  border-radius: 10px;
  text-align: left;
  font-size: 14px;
  color: var(--ink);
  cursor: pointer;
  transition: all 120ms ease;

  &:hover {
    background: var(--soft);
  }

  p {
    margin: 0;
    line-height: 1.4;
    word-break: break-word;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 5px;
  }

  .badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: 6px;
    background: var(--line);
    color: var(--muted);
    text-transform: capitalize;
  }
`;

const Empty = styled.p`
  padding: 28px 12px;
  color: var(--muted);
  font-size: 14px;
  text-align: center;
`;

const CommandHints = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  margin-top: 10px;
  border-top: 1px solid var(--line);
  font-size: 11px;
  color: var(--muted);

  .hint-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  kbd {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--soft);
    border: 1px solid var(--line);
    font-family: inherit;
    font-size: 10px;
    color: var(--ink);
  }
`;

export function SearchModal({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (hit: SearchHit) => Promise<void> }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Results>({ results: [], next_offset: null });
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(''); setSelected(0); setResult({ results: [], next_offset: null });
    if (!query.trim()) { setLoading(false); return; }
    setLoading(true);
    const timeout = setTimeout(() => {
      void api<Results>('/search?q=' + encodeURIComponent(query.trim())).then(data => { if (!cancelled) setResult(data); })
        .catch(e => { if (!cancelled) setError(errorMessage(e)); }).finally(() => { if (!cancelled) setLoading(false); });
    }, 150);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [query, open]);

  useEffect(() => { if (open) document.getElementById(`search-result-${selected}`)?.scrollIntoView({ block: 'nearest' }); }, [selected, open]);

  return <Modal open={open} onClose={onClose} title="Search journal" compact>
    <SearchHeader>
      <SearchIcon size={16} />
      <Input
        autoFocus
        aria-label="Search all notes and to-dos"
        placeholder="Type to search notes, tasks, or #tags..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => {
          if (['ArrowDown', 'ArrowUp'].includes(e.key) && result.results.length) {
            e.preventDefault();
            setSelected(value => (value + (e.key === 'ArrowDown' ? 1 : -1) + result.results.length) % result.results.length);
          }
          if (e.key === 'Enter' && result.results[selected]) {
            e.preventDefault();
            void onSelect(result.results[selected]);
          }
        }}
      />
    </SearchHeader>

    <ResultsList>
      {result.results.map((hit, index) => (
        <Result
          key={`${hit.kind}-${hit.id}`}
          id={`search-result-${index}`}
          $selected={selected === index}
          onClick={() => void onSelect(hit)}
        >
          <p>{markdownText(hit.content).slice(0, 220) || hit.tags?.map(tag => '#' + tag).join(' ')}</p>
          <div className="meta">
            <span className="badge">{hit.date ?? 'To-Do'}</span>
            {hit.tags?.map(t => <span key={t} className="badge" style={{ color: 'var(--tag-selected)' }}>#{t}</span>)}
          </div>
        </Result>
      ))}
    </ResultsList>

    {!loading && query.trim() && !result.results.length && !error && <Empty>No matching entries found</Empty>}
    {error && <InlineError role="alert">{error}</InlineError>}

    {result.next_offset !== null && (
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <TextButton onClick={async () => {
          try {
            const more = await api<Results>(`/search?q=${encodeURIComponent(query.trim())}&offset=${result.next_offset}`);
            setResult(current => ({ results: [...current.results, ...more.results], next_offset: more.next_offset }));
          } catch (e) {
            setError(errorMessage(e));
          }
        }}>Load More Results</TextButton>
      </div>
    )}

    <CommandHints>
      <div className="hint-group">
        <span>Navigate <kbd><ArrowUp size={10} /><ArrowDown size={10} /></kbd></span>
        <span>Open <kbd><CornerDownLeft size={10} /></kbd></span>
      </div>
      <span>Close <kbd>ESC</kbd></span>
    </CommandHints>
  </Modal>;
}
