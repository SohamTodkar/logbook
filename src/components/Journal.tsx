import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import styled from 'styled-components';
import { Calendar, ChevronDown, ListTodo, Zap } from 'lucide-react';
import { dateObject, duration, errorMessage } from '../api';
import type { Day, Task } from '../types';
import { TextButton } from '../styles';
import { Outline } from './Outline';
import { useJournalContext } from '../JournalContext';
import { compactViewport, fullViewport } from '../layout';

const TodoCard = styled.section`
  align-self: stretch;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 100%;
  padding: 18px 20px;
  margin-bottom: 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  transition: box-shadow 200ms ease, border-color 200ms ease;

  &:hover {
    box-shadow: var(--card-shadow-hover);
  }

  @media ${compactViewport} {
    padding: 14px 16px;
    margin-bottom: 16px;
    border-radius: 14px;
  }
`;

const TodoHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  user-select: none;
`;

const TodoTitleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--ink);
  font-size: 16px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  .icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--tag-bg);
    color: var(--tag-ink);
  }

  .count-badge {
    font-size: 12px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 12px;
    background: var(--soft);
    color: var(--muted);
  }
`;

const FoldToggle = styled.button<{ $folded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 150ms ease;

  svg {
    transform: rotate(${({ $folded }) => $folded ? '-90deg' : '0deg'});
    transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover {
    background: var(--soft);
    color: var(--ink);
  }
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 4px;
  background: var(--soft);
  border-radius: 999px;
  margin: 14px 0 10px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => Math.min(100, Math.max(0, $percent))}%;
  background: var(--primary);
  border-radius: 999px;
  transition: width 300ms cubic-bezier(0.16, 1, 0.3, 1);
`;

const DayCard = styled.section<{ $today: boolean; $showHistory: boolean }>`
  margin-bottom: 24px;
  background: var(--surface);
  border: 1px solid ${({ $today }) => $today ? 'var(--line)' : 'var(--line-subtle)'};
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: var(--card-shadow);
  transition: all 200ms ease;

  &:hover {
    box-shadow: var(--card-shadow-hover);
  }

  @media(pointer: coarse) { margin-bottom: 28px; }
  @media ${compactViewport} {
    display: ${({ $today, $showHistory }) => $today || $showHistory ? 'block' : 'none'};
    margin-bottom: 14px;
    padding: 14px 16px;
    border-radius: 14px;
  }
`;

const DateHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-subtle);
`;

const DateTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  .day-label {
    font-size: 16px;
    font-weight: 600;
    color: var(--ink);
    letter-spacing: -0.01em;
  }

  .date-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    background: var(--soft);
    padding: 3px 9px;
    border-radius: 8px;
  }
`;

const FocusBadge = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--soft);
  color: var(--tag-ink);
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: all 140ms ease;

  svg {
    color: var(--primary);
  }

  &:hover {
    background: var(--surface-elevated);
    border-color: var(--focus);
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: default;
    opacity: 0.8;
    transform: none;
  }
`;

const Body = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  > [data-outline-kind='tasks'] { flex: 1; display: flex; flex-direction: column; }
  > [data-outline-kind='tasks'] > [data-task-creation-area] { flex: 1; }
`;

const HistoryEnd = styled.div<{ $showHistory: boolean }>`
  display: flex;
  justify-content: center;
  padding: 24px 0 32px;
  color: var(--sage);
  @media ${compactViewport} {
    display: ${({ $showHistory }) => $showHistory ? 'flex' : 'none'};
    padding: 12px 0 20px;
  }
`;

type Actions = { refresh: () => Promise<void>; notify: (message: string) => void };

export function Todos({ tasks, refresh, notify }: { tasks: Task[] } & Actions) {
  const [folded, setFolded] = useState(false);
  const { target } = useJournalContext();
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    if (target?.kind === 'tasks') setFolded(false);
  }, [target]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed_at).length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <TodoCard ref={section} aria-labelledby="todo-title">
      <TodoHeader>
        <TodoTitleButton
          id="todo-title"
          data-focus-chrome
          aria-expanded={!folded}
          title={folded ? 'Expand tasks' : 'Collapse tasks'}
          onClick={() => setFolded(value => !value)}
        >
          <div className="icon-box">
            <ListTodo size={16} />
          </div>
          <span>Action Items</span>
          <span className="count-badge">
            {totalTasks === 0 ? 'No tasks' : `${completedTasks}/${totalTasks}`}
          </span>
        </TodoTitleButton>

        <FoldToggle
          $folded={folded}
          type="button"
          aria-label={folded ? 'Expand to-dos' : 'Fold to-dos'}
          onClick={() => setFolded(value => !value)}
        >
          <ChevronDown size={18} />
        </FoldToggle>
      </TodoHeader>

      {totalTasks > 0 && (
        <ProgressBarContainer>
          <ProgressBarFill $percent={progressPercent} />
        </ProgressBarContainer>
      )}

      {!folded && (
        <Body style={{ marginTop: totalTasks > 0 ? 8 : 14 }}>
          <Outline kind="tasks" items={tasks} composer={tasks.length > 0} refresh={refresh} notify={notify} />
        </Body>
      )}
    </TodoCard>
  );
}

export function Journal({
  days, today, refresh, notify, openSessions, sessionsEnabled = true, showHistory = false, secondsForDay, loadMore, hasMore, scrollRoot
}: {
  days: Day[]; today: string; openSessions: (date: string) => void; secondsForDay: (day: Day) => number;
  sessionsEnabled?: boolean; showHistory?: boolean; loadMore: () => Promise<void>; hasMore: boolean; scrollRoot: RefObject<HTMLDivElement | null>;
} & Actions) {
  const [loadingMore, setLoadingMore] = useState(false);
  const { target } = useJournalContext();
  const historyEnd = useRef<HTMLDivElement>(null);
  const loadingLock = useRef(false);
  const [historyError, setHistoryError] = useState(false);

  const loadEarlier = useCallback(async () => {
    if (loadingLock.current) return;
    loadingLock.current = true;
    setLoadingMore(true);
    try {
      await loadMore();
      setHistoryError(false);
    } catch (e) {
      setHistoryError(true);
      notify(errorMessage(e));
    } finally {
      setLoadingMore(false);
      loadingLock.current = false;
    }
  }, [loadMore, notify]);

  useEffect(() => {
    if (!hasMore || historyError || !historyEnd.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && (showHistory || window.matchMedia(fullViewport).matches)) {
        void loadEarlier();
      }
    }, { root: scrollRoot.current, rootMargin: '200px' });
    observer.observe(historyEnd.current);
    return () => observer.disconnect();
  }, [hasMore, historyError, loadEarlier, scrollRoot, showHistory]);

  const yesterday = dateObject(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    <section aria-label="Logbook">
      {days.map(day => {
        const isToday = day.date === today;
        const date = dateObject(day.date);
        const seconds = secondsForDay(day);
        const title = isToday ? 'Today' : date.toDateString() === yesterday.toDateString() ? 'Yesterday' : date.toLocaleDateString(undefined, { weekday: 'long' });
        const entries = day.entries?.length ? day.entries : [
          ...day.notes.map(note => ({ ...note, kind: 'notes' as const })),
          ...(day.tasks ?? []).map(task => ({ ...task, kind: 'tasks' as const })),
        ];
        const targeted = target && entries.some(entry => entry.kind === target.kind && entry.id === target.id);

        return (
          <DayCard
            key={day.date}
            $today={isToday || !!targeted}
            $showHistory={showHistory}
            aria-label={`${title}, ${day.date}`}
            onClick={event => {
              if ((event.target as Element).closest('button, a, input, [contenteditable], [role="group"]') || window.getSelection()?.toString()) return;
              window.dispatchEvent(new CustomEvent('still-new-bullet', { detail: `still-draft-${day.date}` }));
            }}
          >
            <DateHead data-focus-chrome>
              <DateTitleGroup>
                <span className="day-label">{title}</span>
                <span className="date-chip">
                  <Calendar size={13} />
                  <time dateTime={day.date}>
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </time>
                </span>
              </DateTitleGroup>

              {seconds >= 1 && (
                <FocusBadge
                  type="button"
                  aria-label={`Focus sessions for ${day.date}`}
                  disabled={!sessionsEnabled}
                  onClick={() => { if (sessionsEnabled) openSessions(day.date); }}
                  title={sessionsEnabled ? 'View & edit focus sessions' : undefined}
                >
                  <Zap size={13} />
                  <span>{duration(seconds, true)} focused</span>
                </FocusBadge>
              )}
            </DateHead>

            <Body>
              <Outline
                kind="mixed"
                items={entries}
                day={day.date}
                archived
                composer={isToday}
                refresh={refresh}
                notify={notify}
              />
            </Body>
          </DayCard>
        );
      })}

      <HistoryEnd ref={historyEnd} $showHistory={showHistory}>
        {hasMore && (
          <TextButton disabled={loadingMore} onClick={() => void loadEarlier()}>
            {historyError ? 'Retry loading days' : 'Load earlier days...'}
          </TextButton>
        )}
      </HistoryEnd>
    </section>
  );
}
