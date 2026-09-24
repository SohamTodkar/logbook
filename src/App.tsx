import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import {
  ChartNoAxesColumn,
  Github,
  Moon,
  Sun,
  Play,
  Square,
  Search,
  PanelLeft,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Calendar,
  HelpCircle,
} from 'lucide-react';
import { api, errorMessage, localDate, recoverEarlierDrafts, timerDuration } from './api';
import { FocusSound } from './audio';
import type { Day, JournalData, Session } from './types';
import { Button, Muted, TextButton } from './styles';
import { Journal, Todos } from './components/Journal';
import { TagTabs } from './components/TagTabs';
import { JournalContext, flushDrafts } from './JournalContext';
import { Modal } from './components/Modal';
import type { SearchHit } from './components/SearchModal';
import { documentUndo, recordCompletion } from './documentHistory';
import { compactViewport } from './layout';

const JOURNAL_PAGE_SIZE = 14;
const REPOSITORY_URL = import.meta.env.VITE_REPOSITORY_URL || 'https://github.com/divyavenn/still';
const SessionsModal = lazy(() => import('./components/SessionsModal').then(module => ({ default: module.SessionsModal })));
const StatsModal = lazy(() => import('./components/StatsModal').then(module => ({ default: module.StatsModal })));
const SearchModal = lazy(() => import('./components/SearchModal').then(module => ({ default: module.SearchModal })));

const Page = styled.div<{ $focusing: boolean }>`
  --current-page-paper: ${({ $focusing }) => $focusing ? 'var(--page-focus-paper)' : 'var(--page-paper)'};
  height: 100dvh;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: var(--current-page-paper);
  transition: background-color 200ms ease;

  [data-focus-chrome] {
    opacity: ${({ $focusing }) => $focusing ? 'var(--focus-chrome-opacity)' : 'var(--chrome-opacity)'};
    transition: opacity 200ms ease;
  }
`;

const pulseGlow = keyframes`
  0% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
  70% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 8px rgba(79, 70, 229, 0); }
  100% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
`;

const pulseGlowTeal = keyframes`
  0% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.7); }
  70% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 8px rgba(45, 212, 191, 0); }
  100% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(45, 212, 191, 0); }
`;

const TopNav = styled.header`
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 200ms ease;

  @media ${compactViewport} {
    padding: 10px 16px;
  }
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BrandButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 0;
  padding: 0;
  color: var(--ink);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  cursor: pointer;

  .logo-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--primary);
    color: var(--primary-ink);
  }
`;

const SearchTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--soft);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 140ms ease;

  kbd {
    display: inline-flex;
    align-items: center;
    padding: 1px 5px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 4px;
    font-size: 10px;
    color: var(--muted);
  }

  &:hover {
    background: var(--surface-elevated);
    border-color: var(--focus);
    color: var(--ink);
  }

  @media (max-width: 640px) {
    display: none;
  }
`;

const NavCenter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 840px) {
    display: none;
  }
`;

const FilterPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--tag-bg);
  border: 1px solid var(--line);
  color: var(--tag-ink);
  font-size: 12px;
  font-weight: 500;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    opacity: 0.7;
    &:hover { opacity: 1; }
  }
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FocusCapsule = styled.div<{ $running: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 4px 12px;
  background: ${({ $running }) => $running ? 'var(--tag-bg)' : 'var(--soft)'};
  border: 1px solid ${({ $running }) => $running ? 'var(--timer-running-ring)' : 'var(--line)'};
  border-radius: 999px;
  transition: all 200ms ease;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $running }) => $running ? 'var(--primary)' : 'var(--muted)'};
    ${({ $running }) => $running && css`
      animation: ${pulseGlow} 2s infinite;
      :root[data-theme='night'] & {
        animation: ${pulseGlowTeal} 2s infinite;
      }
    `}
  }

  .time-text {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: ${({ $running }) => $running ? 'var(--primary)' : 'var(--muted)'};
    letter-spacing: -0.01em;
  }
`;

const CapsuleAction = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: ${({ $primary }) => $primary ? 'var(--primary)' : 'transparent'};
  color: ${({ $primary }) => $primary ? 'var(--primary-ink)' : 'var(--muted)'};
  cursor: pointer;
  transition: all 120ms ease;

  &:hover {
    transform: scale(1.08);
    color: ${({ $primary }) => $primary ? 'var(--primary-ink)' : 'var(--ink)'};
  }

  &:active {
    transform: scale(0.94);
  }
`;

const NavIconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 120ms ease;

  &:hover {
    background: var(--soft);
    color: var(--ink);
    border-color: var(--line);
  }
`;

const MainContainer = styled.main`
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 28px 20px 80px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  @media ${compactViewport} {
    padding: 16px 12px 60px;
  }
`;

const LogViewport = styled.div`
  flex: 1;
  min-height: min(240px, max(64px, calc(100dvh - 160px)));
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
  padding-bottom: 24px;
`;

const Toast = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  max-width: min(540px, calc(100% - 32px));
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
`;

const SoundMenu = styled.div`
  display: grid;
  gap: 12px;
  padding: 6px;
  button { justify-content: center; }
  input { width: 100%; min-height: 36px; accent-color: var(--primary); }
`;

const ShortcutPanel = styled.div`
  padding: 6px 12px 12px;
`;

const ShortcutRows = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  column-gap: 20px;
  row-gap: 6px;
`;

const ShortcutRow = styled.div`
  display: contents;
  > * {
    min-height: 32px;
    padding: 6px 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
  }
`;

const Keys = styled.span`
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
  kbd {
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--soft);
    border: 1px solid var(--line);
    color: var(--ink);
  }
`;

const Demo = styled.span`
  min-width: 0;
  font-size: 13px;
  color: var(--ink);
  code {
    padding: 2px 5px;
    border-radius: 4px;
    background: var(--soft);
    color: var(--primary);
    font-size: 12px;
  }
`;

const ConnectionState = styled.div`
  padding: 60px 0;
  display: grid;
  gap: 16px;
  justify-items: center;
  text-align: center;
`;

export default function App({ locked = false, load = !locked, onReady, onLoadError }: {
  locked?: boolean; load?: boolean; onReady?: () => void; onLoadError?: () => void;
}) {
  const [data, setData] = useState<JournalData | null>(null);
  const [night, setNight] = useState(() => localStorage.getItem('still-theme') === 'night');

  useEffect(() => {
    document.documentElement.dataset.theme = night ? 'night' : 'day';
    localStorage.setItem('still-theme', night ? 'night' : 'day');
  }, [night]);

  const [activeTag, setActiveTag] = useState<string | null>(null);
  const tagRef = useRef<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completed, setCompleted] = useState(new Set<number>());
  const [reopened, setReopened] = useState(new Set<number>());
  const [undoTask, setUndoTask] = useState<{ id: number; completedAt: string } | null>(null);
  const [target, setTarget] = useState<{ kind: 'notes' | 'tasks'; id: number } | null>(null);
  const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reopenTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onComplete = (ids: number[], taskId?: number, completedAt?: string) => {
    if (completionTimeout.current) clearTimeout(completionTimeout.current);
    setCompleted(new Set(ids));
    if (taskId && completedAt) { recordCompletion(taskId, completedAt); setUndoTask({ id: taskId, completedAt }); }
    completionTimeout.current = setTimeout(() => setCompleted(new Set()), 1000);
  };

  const onReopen = (ids: number[]) => {
    if (reopenTimeout.current) clearTimeout(reopenTimeout.current);
    setReopened(new Set(ids));
    reopenTimeout.current = setTimeout(() => setReopened(new Set()), 1000);
  };

  useEffect(() => () => {
    if (completionTimeout.current) clearTimeout(completionTimeout.current);
    if (reopenTimeout.current) clearTimeout(reopenTimeout.current);
  }, []);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const [statsOpen, setStatsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [sessionsDate, setSessionsDate] = useState<string | null>(null);
  const [timerBusy, setTimerBusy] = useState(false);
  const [audible, setAudible] = useState(false);
  const [volume, setVolume] = useState(() => Math.max(0, Math.min(1, Number(localStorage.getItem('still-volume') ?? '0.22') || 0)));
  const sound = useRef(new FocusSound());
  const timerLock = useRef(false);
  const clockOffset = useRef(0);
  const generation = useRef(0);
  const loadedThrough = useRef<string | null>(null);
  const logViewport = useRef<HTMLDivElement>(null);

  const notify = useCallback((text: string) => setMessage(text), []);

  useEffect(() => {
    if (locked) return;
    const shortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey) {
        if (['z', 'y'].includes(event.key.toLowerCase())) {
          event.preventDefault();
          void documentUndo(event.shiftKey || event.key.toLowerCase() === 'y').catch(e => notify(errorMessage(e)));
        }
        if (event.key.toLowerCase() === 'k' || event.key.toLowerCase() === 'f') {
          event.preventDefault();
          setSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [locked, notify]);

  const refresh = useCallback(async (includeHistory = true) => {
    const sequence = ++generation.current;
    const tagQuery = tagRef.current ? '&tag=' + encodeURIComponent(tagRef.current) : '';
    let response = await api<JournalData>(`/journal?limit=${JOURNAL_PAGE_SIZE}${tagQuery}`);
    try {
      if (await recoverEarlierDrafts(response.today)) response = await api<JournalData>(`/journal?limit=${JOURNAL_PAGE_SIZE}${tagQuery}`);
    } catch { notify('Could not save an earlier draft. Retrying automatically.'); }
    while (includeHistory && loadedThrough.current && response.next_cursor && response.next_cursor > loadedThrough.current) {
      const more = await api<JournalData>(`/journal?before=${response.next_cursor}&limit=${JOURNAL_PAGE_SIZE}${tagQuery}`);
      response.days.push(...more.days);
      response.next_cursor = more.next_cursor;
    }
    if (sequence !== generation.current) return;
    if (tagRef.current && !response.tags?.some(tag => tag.name === tagRef.current)) {
      tagRef.current = null; loadedThrough.current = null; setActiveTag(null); return;
    }
    clockOffset.current = new Date(response.server_time).getTime() - Date.now();
    setData(previous => {
      if (includeHistory || !previous || previous.tag !== response.tag) return response;
      const oldest = response.days.at(-1)?.date ?? response.today;
      const cachedDays = previous.days.filter(day => day.date < oldest);
      return { ...response, days: [...response.days, ...cachedDays], next_cursor: cachedDays.length ? previous.next_cursor : response.next_cursor };
    });
    setError('');
  }, [notify]);

  useEffect(() => {
    const applied = () => { void refresh().catch(e => notify(errorMessage(e))); };
    const failed = (event: Event) => notify((event as CustomEvent<string>).detail);
    const edited = () => setUndoTask(null);
    window.addEventListener('still-history-applied', applied);
    window.addEventListener('still-history-error', failed);
    window.addEventListener('still-history-available', edited);
    return () => {
      window.removeEventListener('still-history-applied', applied);
      window.removeEventListener('still-history-error', failed);
      window.removeEventListener('still-history-available', edited);
    };
  }, [refresh, notify]);

  useEffect(() => {
    if (!load) { setData(null); return; }
    void refresh(false).catch(e => { setError(errorMessage(e)); onLoadError?.(); });
  }, [refresh, activeTag, load, onLoadError]);

  useEffect(() => {
    if (locked || !load) return;
    const interval = setInterval(() => { void refresh(false).catch(e => setError(errorMessage(e))); }, 15000);
    const focus = () => { void refresh(false).catch(e => setError(errorMessage(e))); };
    window.addEventListener('focus', focus);
    return () => { clearInterval(interval); window.removeEventListener('focus', focus); };
  }, [refresh, locked, load]);

  useEffect(() => { if (data && load) onReady?.(); }, [data, load, onReady]);

  useEffect(() => {
    if (!data?.active_session) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [data?.active_session?.id]);

  useEffect(() => {
    if (locked) return;
    let day = localDate();
    const interval = setInterval(() => {
      const next = localDate();
      if (next !== day) { day = next; setNow(Date.now()); void refresh(false).catch(e => setError(errorMessage(e))); }
    }, 1000);
    return () => clearInterval(interval);
  }, [refresh, locked]);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(''), 6000);
    return () => clearTimeout(id);
  }, [message]);

  useEffect(() => {
    if (!data?.active_session) { sound.current.stop(); setAudible(false); }
  }, [data?.active_session?.id]);

  useEffect(() => {
    const currentSound = sound.current;
    return () => currentSound.dispose();
  }, []);

  const active = data?.active_session;

  const adjustedNow = now + clockOffset.current;
  const elapsed = active ? Math.max(0, (adjustedNow - new Date(active.started_at).getTime()) / 1000) : 0;

  const toggleTimer = async () => {
    if (timerLock.current) return;
    timerLock.current = true;
    setTimerBusy(true);
    try {
      if (active) {
        await api<Session>('/timer/stop', 'POST', { session_id: active.id });
        sound.current.stop();
        setAudible(false);
        setData(current => current ? { ...current, active_session: null } : current);
      } else {
        if (localStorage.getItem('still-muted') !== 'true') {
          void sound.current.start(volume).then(() => setAudible(true)).catch(() => notify('Audio paused. Open sound menu to resume.'));
        }
        const started = await api<Session>('/timer/start', 'POST');
        setData(current => current ? { ...current, active_session: started } : current);
      }
      await refresh();
    } catch (e) {
      if (!active) { sound.current.stop(); setAudible(false); }
      notify(errorMessage(e));
    } finally {
      timerLock.current = false;
      setTimerBusy(false);
    }
  };

  const toggleSound = async () => {
    if (audible) {
      sound.current.stop();
      setAudible(false);
      localStorage.setItem('still-muted', 'true');
    } else {
      try {
        await sound.current.start(volume);
        setAudible(true);
        localStorage.setItem('still-muted', 'false');
      } catch {
        notify('Your browser couldn’t start audio. Timer is still running.');
      }
    }
  };

  const secondsForDay = (day: Day) => {
    if (!active || !data || day.date !== data.today) return day.focused_seconds;
    return day.focused_seconds + Math.max(0, (adjustedNow - new Date(data.server_time).getTime()) / 1000);
  };

  const selectTag = async (tag: string | null) => {
    try {
      await flushDrafts();
      tagRef.current = tag;
      loadedThrough.current = null;
      generation.current++;
      setActiveTag(tag);
      if (logViewport.current) logViewport.current.scrollTop = 0;
    } catch (error) {
      notify(errorMessage(error));
    }
  };

  const loadMore = useCallback(async () => {
    const cursor = data?.next_cursor;
    if (!cursor) return;
    const filter = tagRef.current;
    const more = await api<JournalData>(`/journal?before=${cursor}&limit=${JOURNAL_PAGE_SIZE}${filter ? '&tag=' + encodeURIComponent(filter) : ''}`);
    if (filter !== tagRef.current) return;
    loadedThrough.current = more.days.at(-1)?.date ?? loadedThrough.current;
    setData(current => current ? {
      ...current,
      days: [...current.days, ...more.days.filter(day => !current.days.some(existing => existing.date === day.date))],
      next_cursor: more.next_cursor
    } : current);
  }, [data?.next_cursor]);

  const jumpTo = async (hit: SearchHit) => {
    try {
      await flushDrafts();
      tagRef.current = null;
      loadedThrough.current = null;
      setActiveTag(null);
      setTarget(null);
      await refresh();
      if (hit.date) {
        const result = await api<JournalData>(`/journal?on=${hit.date}`);
        setData(current => current ? {
          ...current,
          days: [...current.days.filter(day => day.date !== hit.date), ...result.days].sort((a, b) => b.date.localeCompare(a.date))
        } : current);
      }
      setSearchOpen(false);
      setTimeout(() => setTarget({ kind: hit.kind, id: hit.id }), 180);
    } catch (e) {
      notify(errorMessage(e));
    }
  };

  const sidebarControls = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {REPOSITORY_URL && (
        <NavIconButton
          as="a"
          href={REPOSITORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository"
          title="GitHub"
        >
          <Github size={16} />
        </NavIconButton>
      )}
      <NavIconButton aria-label="Focus statistics" title="Statistics" onClick={() => setStatsOpen(true)}>
        <ChartNoAxesColumn size={16} />
      </NavIconButton>
      <NavIconButton aria-label="Keyboard shortcuts" title="Keyboard shortcuts" onClick={() => setShortcutsOpen(true)}>
        <HelpCircle size={16} />
      </NavIconButton>
      <NavIconButton
        role="switch"
        aria-label="Toggle theme"
        aria-checked={night}
        title={night ? 'Light mode' : 'Dark mode'}
        onClick={() => setNight(v => !v)}
      >
        {night ? <Sun size={16} /> : <Moon size={16} />}
      </NavIconButton>
    </div>
  );

  return (
    <JournalContext.Provider value={{ tags: data?.tags ?? [], activeTag: data?.tag ?? null, completed, onComplete, reopened, onReopen, target }}>
      <Page $focusing={!!active} data-testid="page">
        {/* Modern Top Navigation Bar */}
        <TopNav>
          <NavLeft>
            <NavIconButton
              aria-label="Toggle topics sidebar"
              title="Topics & Tags"
              onClick={() => setSidebarOpen(v => !v)}
            >
              <PanelLeft size={18} />
            </NavIconButton>

            <BrandButton type="button" onClick={() => void selectTag(null)}>
              <div className="logo-badge">
                <Sparkles size={16} />
              </div>
              <span>Logbook</span>
            </BrandButton>

            <SearchTrigger type="button" onClick={() => setSearchOpen(true)}>
              <Search size={14} />
              <span>Search...</span>
              <kbd>⌘K</kbd>
            </SearchTrigger>
          </NavLeft>

          <NavCenter>
            {activeTag ? (
              <FilterPill>
                <span>#{activeTag}</span>
                <button type="button" title="Clear tag filter" onClick={() => void selectTag(null)}>
                  <X size={12} />
                </button>
              </FilterPill>
            ) : (
              data && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
                  <Calendar size={14} />
                  <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              )
            )}
          </NavCenter>

          <NavRight>
            {/* Sleek Interactive Focus Pill */}
            <FocusCapsule
              $running={!!active}
              onContextMenu={e => { e.preventDefault(); setSoundOpen(true); }}
            >
              <div className="status-dot" />
              <span className="time-text">{timerDuration(elapsed)}</span>
              <CapsuleAction
                $primary
                disabled={timerBusy || !data}
                title={active ? 'Pause Focus' : 'Start Focus'}
                onClick={() => void toggleTimer()}
              >
                {active ? <Square size={12} /> : <Play size={12} />}
              </CapsuleAction>
              {active && (
                <CapsuleAction
                  title={audible ? 'Mute ambient sound' : 'Unmute ambient sound'}
                  onClick={() => void toggleSound()}
                >
                  {audible ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </CapsuleAction>
              )}
            </FocusCapsule>

            <NavIconButton
              aria-label="Focus statistics"
              title="Focus Statistics"
              onClick={() => setStatsOpen(true)}
            >
              <ChartNoAxesColumn size={17} />
            </NavIconButton>

            <NavIconButton
              role="switch"
              aria-label="Theme mode"
              aria-checked={night}
              title={night ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setNight(v => !v)}
            >
              {night ? <Sun size={17} /> : <Moon size={17} />}
            </NavIconButton>
          </NavRight>
        </TopNav>

        {/* Slide-out Sidebar Drawer */}
        <TagTabs
          tags={data?.tags ?? []}
          active={activeTag}
          isOpen={sidebarOpen}
          onToggle={setSidebarOpen}
          onSelect={tag => { void selectTag(tag); }}
          controls={sidebarControls}
        />

        {/* Main Content Workspace */}
        <MainContainer data-focus-surface>
          {!data ? (
            <ConnectionState>
              <Muted>{error || 'Connecting to your logbook...'}</Muted>
              {error && (
                <Button $primary onClick={() => { setError(''); void refresh().catch(e => setError(errorMessage(e))); }}>
                  Retry Connection
                </Button>
              )}
            </ConnectionState>
          ) : (
            <>
              {/* Task Hub */}
              <Todos
                key={data.tag ?? 'all'}
                tasks={data.tasks}
                refresh={refresh}
                notify={notify}
              />

              {/* Journal Days Timeline */}
              <LogViewport ref={logViewport}>
                <Journal
                  key={data.tag ?? 'all'}
                  scrollRoot={logViewport}
                  days={data.days}
                  today={data.today}
                  refresh={refresh}
                  notify={notify}
                  openSessions={setSessionsDate}
                  secondsForDay={secondsForDay}
                  hasMore={!!data.next_cursor}
                  loadMore={loadMore}
                />
                {error && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <TextButton onClick={() => void refresh().catch(e => notify(errorMessage(e)))}>
                      Connection lost · Click to retry
                    </TextButton>
                  </div>
                )}
              </LogViewport>
            </>
          )}
        </MainContainer>

        {/* Modals */}
        <Suspense fallback={null}>
          {sessionsDate && <SessionsModal date={sessionsDate} onClose={() => setSessionsDate(null)} onChange={refresh} />}
          {statsOpen && <StatsModal open onClose={() => setStatsOpen(false)} />}
          {searchOpen && <SearchModal open onClose={() => setSearchOpen(false)} onSelect={jumpTo} />}
        </Suspense>

        <Modal open={soundOpen} onClose={() => setSoundOpen(false)} title="Focus Audio" compact>
          <SoundMenu>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Ambient White Noise</span>
              <Button $primary onClick={() => void toggleSound()}>
                {audible ? 'Mute' : 'Play Sound'}
              </Button>
            </div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'grid', gap: 6 }}>
              Volume ({Math.round(volume * 100)}%)
              <input
                aria-label="Focus sound volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={e => {
                  const value = Number(e.target.value);
                  setVolume(value);
                  localStorage.setItem('still-volume', String(value));
                  sound.current.setVolume(value);
                }}
              />
            </label>
          </SoundMenu>
        </Modal>

        <Modal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} title="Keyboard Shortcuts" compact>
          <ShortcutPanel>
            <ShortcutRows>
              <ShortcutRow><Demo>Create next bullet</Demo><Keys><kbd>Enter</kbd></Keys></ShortcutRow>
              <ShortcutRow><Demo>Line break within bullet</Demo><Keys><kbd>Shift</kbd> + <kbd>Enter</kbd></Keys></ShortcutRow>
              <ShortcutRow><Demo>Indent entry</Demo><Keys><kbd>Tab</kbd></Keys></ShortcutRow>
              <ShortcutRow><Demo>Outdent entry</Demo><Keys><kbd>Shift</kbd> + <kbd>Tab</kbd></Keys></ShortcutRow>
              <ShortcutRow><Demo>Bold</Demo><Keys><kbd>⌘/Ctrl</kbd> + <kbd>B</kbd></Keys></ShortcutRow>
              <ShortcutRow><Demo>Italic</Demo><Keys><kbd>⌘/Ctrl</kbd> + <kbd>I</kbd></Keys></ShortcutRow>
              <ShortcutRow><Demo>Underline</Demo><Keys><kbd>⌘/Ctrl</kbd> + <kbd>U</kbd></Keys></ShortcutRow>
              <ShortcutRow><Demo>Add or edit link</Demo><Keys><kbd>⌘/Ctrl</kbd> + <kbd>K</kbd></Keys></ShortcutRow>
              <ShortcutRow><Demo>Inline <code>code</code></Demo><Keys><kbd>⌘/Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd></Keys></ShortcutRow>
              <ShortcutRow><Demo>Search journal</Demo><Keys><kbd>⌘/Ctrl</kbd> + <kbd>K</kbd></Keys></ShortcutRow>
              <ShortcutRow><Demo>Undo</Demo><Keys><kbd>⌘/Ctrl</kbd> + <kbd>Z</kbd></Keys></ShortcutRow>
              <ShortcutRow><Demo>Redo</Demo><Keys><kbd>⌘/Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd></Keys></ShortcutRow>
            </ShortcutRows>
          </ShortcutPanel>
        </Modal>

        {undoTask && !message && (
          <Toast>
            <span>Task marked as completed</span>
            <Button onClick={async () => {
              try { await documentUndo(); setUndoTask(null); }
              catch (e) { notify(errorMessage(e)); }
            }}>Undo</Button>
            <CapsuleAction aria-label="Dismiss undo" onClick={() => setUndoTask(null)}>
              <X size={14} />
            </CapsuleAction>
          </Toast>
        )}

        {message && (
          <Toast role="status">
            <span>{message}</span>
            <CapsuleAction aria-label="Dismiss notification" onClick={() => setMessage('')}>
              <X size={14} />
            </CapsuleAction>
          </Toast>
        )}
      </Page>
    </JournalContext.Provider>
  );
}
