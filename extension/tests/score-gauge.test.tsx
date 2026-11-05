import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreGauge } from '../src/sidepanel/components/ScoreGauge';

describe('ScoreGauge Component', () => {
  it('renders green Clean Signals badge for high score >= 85', async () => {
    render(<ScoreGauge score={95} />);

    expect(screen.getByTestId('score-gauge')).toBeInTheDocument();
    expect(screen.getByText('Safety Index')).toBeInTheDocument();
    expect(screen.getByText('Clean Signals')).toBeInTheDocument();
  });

  it('renders amber Caution badge for medium score between 50 and 84', () => {
    render(<ScoreGauge score={70} />);

    expect(screen.getByText('Caution Warranted')).toBeInTheDocument();
  });

  it('renders red High Threat badge for score < 50', () => {
    render(<ScoreGauge score={25} />);

    expect(screen.getByText('High Threat')).toBeInTheDocument();
  });

  it('clamps scores safely between 1 and 100', () => {
    const { unmount } = render(<ScoreGauge score={150} />);
    expect(screen.getByText('Clean Signals')).toBeInTheDocument();
    unmount();

    render(<ScoreGauge score={-20} />);
    expect(screen.getByText('High Threat')).toBeInTheDocument();
  });

  it('renders an unscored state instead of claiming clean signals', () => {
    render(<ScoreGauge score={undefined} />);

    expect(screen.getByText('Not scored')).toBeInTheDocument();
    expect(screen.queryByText('Clean Signals')).not.toBeInTheDocument();
    expect(screen.getByTestId('score-value')).toHaveTextContent('—');
    expect(screen.getByText('no score')).toBeInTheDocument();
  });
});
