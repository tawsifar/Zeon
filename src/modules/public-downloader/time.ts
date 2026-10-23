/**
 * Time and timestamp parsing, formatting, and validation utilities
 * for Zeon precision time-range clipping.
 */

/**
 * Strict regex for validating timestamp or seconds input:
 * Matches:
 * - HH:MM:SS (e.g. 01:23:45)
 * - MM:SS (e.g. 01:30, 0:45)
 * - Raw numeric seconds (e.g. 90, 45.5, 0)
 */
export const TIMESTAMP_REGEX = /^(?:(?:(\d{1,2}):)?([0-5]?\d):([0-5]\d)(?:\.\d+)?|(\d+(?:\.\d+)?))$/;

/**
 * Parses a user input string or number into seconds.
 * Returns null if the value is invalid, negative, or does not match the timestamp pattern.
 */
export function parseTimestampToSeconds(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;

  if (typeof input === 'number') {
    if (isNaN(input) || input < 0 || !isFinite(input)) return null;
    return input;
  }

  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(TIMESTAMP_REGEX);
  if (!match) return null;

  // Case 1: Pure numeric seconds string (e.g. "90" or "45.5")
  if (match[4] !== undefined) {
    const parsed = parseFloat(match[4]);
    return isNaN(parsed) || parsed < 0 ? null : parsed;
  }

  // Case 2: Formatted timestamp [HH:]MM:SS
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = parseInt(match[2], 10);
  const seconds = parseFloat(match[3]);

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;

  const total = hours * 3600 + minutes * 60 + seconds;
  return total >= 0 ? total : null;
}

/**
 * Formats total seconds into a clean display timestamp:
 * - "00:00" or "01:30" (when < 1 hour and forceHours is false)
 * - "00:00:00" or "01:23:45" (when >= 1 hour or forceHours is true)
 */
export function formatSecondsToTimestamp(seconds: number, forceHours = false): string {
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) {
    return forceHours ? '00:00:00' : '00:00';
  }

  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);

  if (hrs > 0 || forceHours) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats seconds safely for filesystem naming without illegal characters:
 * e.g., 90s -> "01-30" or 3690s -> "01-01-30"
 */
export function formatSecondsForFilename(seconds: number): string {
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return '00-00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}-${mins.toString().padStart(2, '0')}-${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}-${secs.toString().padStart(2, '0')}`;
}

export interface TrimValidationResult {
  isValid: boolean;
  startSeconds: number;
  endSeconds: number;
  error?: string;
}

/**
 * Validates start and end inputs according to clipping requirements:
 * 1. 0 <= startTime < endTime
 * 2. endTime <= duration (when duration is provided and > 0)
 * 3. Minimum clip length: 1 second
 */
export function validateTrimInputs(
  startInput: string | number,
  endInput: string | number,
  totalDuration?: number
): TrimValidationResult {
  const startSec = parseTimestampToSeconds(startInput);
  const endSec = parseTimestampToSeconds(endInput);

  if (startSec === null) {
    return {
      isValid: false,
      startSeconds: 0,
      endSeconds: 0,
      error: 'Invalid start time format. Use MM:SS or HH:MM:SS.',
    };
  }

  if (endSec === null) {
    return {
      isValid: false,
      startSeconds: startSec,
      endSeconds: 0,
      error: 'Invalid end time format. Use MM:SS or HH:MM:SS.',
    };
  }

  if (startSec < 0) {
    return {
      isValid: false,
      startSeconds: startSec,
      endSeconds: endSec,
      error: 'Start time cannot be negative.',
    };
  }

  if (endSec <= startSec) {
    return {
      isValid: false,
      startSeconds: startSec,
      endSeconds: endSec,
      error: 'End time must be greater than start time.',
    };
  }

  if (endSec - startSec < 1) {
    return {
      isValid: false,
      startSeconds: startSec,
      endSeconds: endSec,
      error: 'Minimum clip length is 1 second.',
    };
  }

  if (typeof totalDuration === 'number' && totalDuration > 0) {
    // Add small tolerance (0.5s) for rounding differences with probe durations
    if (endSec > totalDuration + 0.5) {
      return {
        isValid: false,
        startSeconds: startSec,
        endSeconds: endSec,
        error: `End time exceeds total media duration (${formatSecondsToTimestamp(totalDuration)}).`,
      };
    }
  }

  return {
    isValid: true,
    startSeconds: startSec,
    endSeconds: endSec,
  };
}
