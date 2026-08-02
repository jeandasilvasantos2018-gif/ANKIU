import { FlashCard, ReviewRating } from '../types';

export interface SM2Result {
  interval: number;
  easeFactor: number;
  repetitions: number;
  state: FlashCard['state'];
  nextReview: string;
}

/**
 * Calculates next SM-2 interval and parameters based on review response rating.
 */
export function calculateSM2(card: FlashCard, rating: ReviewRating): SM2Result {
  let { interval, easeFactor, repetitions } = card;
  const now = new Date();

  // Ensure defaults
  interval = interval ?? 0;
  easeFactor = easeFactor ?? 2.5;
  repetitions = repetitions ?? 0;

  switch (rating) {
    case 'again': {
      repetitions = 0;
      interval = 0; // Same day review / 1 minute
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;
    }
    case 'hard': {
      if (repetitions === 0) {
        interval = 1; // 1 day
      } else {
        interval = Math.max(1, Math.round(interval * 1.2));
      }
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      repetitions += 1;
      break;
    }
    case 'good': {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 3;
      } else {
        interval = Math.max(1, Math.round(interval * easeFactor));
      }
      repetitions += 1;
      break;
    }
    case 'easy': {
      if (repetitions === 0) {
        interval = 4;
      } else if (repetitions === 1) {
        interval = 7;
      } else {
        interval = Math.max(1, Math.round(interval * easeFactor * 1.3));
      }
      easeFactor += 0.15;
      repetitions += 1;
      break;
    }
  }

  // Determine state
  let state: FlashCard['state'] = 'Aprendendo';
  if (interval >= 21 || repetitions >= 5) {
    state = 'Dominado';
  } else if (repetitions > 0 && interval > 0) {
    state = 'Revisão';
  }

  // Calculate next review date
  const nextDate = new Date(now);
  if (rating === 'again') {
    // 10 minutes from now
    nextDate.setMinutes(nextDate.getMinutes() + 10);
  } else {
    nextDate.setDate(nextDate.getDate() + interval);
  }

  return {
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    repetitions,
    state,
    nextReview: nextDate.toISOString(),
  };
}

/**
 * Get human-readable interval preview for rating button labels
 */
export function getIntervalPreview(card: FlashCard, rating: ReviewRating): string {
  const res = calculateSM2(card, rating);
  if (rating === 'again') return '< 1 min';
  if (res.interval === 0) return '10 min';
  if (res.interval === 1) return '1 dia';
  return `${res.interval} dias`;
}
