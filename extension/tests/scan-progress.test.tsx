import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useElapsedSeconds } from '../src/hooks/useElapsedSeconds';
import { ScanProgress, formatElapsed } from '../src/components/ScanProgress';

afterEach(() => {
  vi.useRealTimers();
});

describe('formatElapsed', () => {
  it('formats seconds and minutes', () => {
    expect(formatElapsed(0)).toBe('0s');
    expect(formatElapsed(9)).toBe('9s');
    expect(formatElapsed(60)).toBe('1m 00s');
    expect(formatElapsed(65)).toBe('1m 05s');
  });
});

describe('useElapsedSeconds', () => {
  it('counts seconds while active and resets when inactive', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) => useElapsedSeconds(active),
      { initialProps: { active: true } }
    );

    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBe(3);

    rerender({ active: false });
    expect(result.current).toBe(0);

    // Inactive state must not keep counting in the background.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(0);
  });

  it('restarts at zero on a new scan', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) => useElapsedSeconds(active),
      { initialProps: { active: true } }
    );

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current).toBe(4);

    rerender({ active: false });
    rerender({ active: true });
    expect(result.current).toBe(0);
  });
});

describe('ScanProgress', () => {
  it('renders nothing while inactive', () => {
    render(
      <ScanProgress
        active={false}
        elapsedSeconds={0}
        stage="Running deterministic checks + AI analysis"
      />
    );

    expect(screen.queryByTestId('scan-progress')).not.toBeInTheDocument();
  });

  it('announces the honest stage and elapsed time without a fake percentage', () => {
    render(
      <ScanProgress
        active
        elapsedSeconds={12}
        stage="Running deterministic checks + AI analysis"
        hint="Free-tier AI can take up to about a minute."
      />
    );

    const progress = screen.getByTestId('scan-progress');
    expect(progress).toHaveAttribute('role', 'status');
    expect(progress).toHaveAttribute('aria-live', 'polite');
    expect(progress).toHaveTextContent('Running deterministic checks + AI analysis');
    expect(screen.getByTestId('scan-elapsed')).toHaveTextContent('12s');
    expect(progress).toHaveTextContent('Free-tier AI can take up to about a minute.');
    expect(progress).not.toHaveTextContent(/\d+%/);
  });
});
