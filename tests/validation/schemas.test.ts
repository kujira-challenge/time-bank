import { describe, it, expect } from 'vitest';
import {
  getMondayOfWeek,
  formatDateISO,
  normalizeTags,
  entrySchema,
} from '@/lib/validation/schemas';

describe('getMondayOfWeek', () => {
  it('should return Monday for a date in the middle of the week', () => {
    const wednesday = new Date('2025-01-22'); // Wednesday
    const monday = getMondayOfWeek(wednesday);
    expect(formatDateISO(monday)).toBe('2025-01-20');
  });

  it('should return the same date if already Monday', () => {
    const monday = new Date('2025-01-20'); // Monday
    const result = getMondayOfWeek(monday);
    expect(formatDateISO(result)).toBe('2025-01-20');
  });

  it('should return previous Monday for Sunday', () => {
    const sunday = new Date('2025-01-26'); // Sunday
    const monday = getMondayOfWeek(sunday);
    expect(formatDateISO(monday)).toBe('2025-01-20');
  });
});

describe('normalizeTags', () => {
  it('should trim and lowercase tags', () => {
    const tags = ['  Development  ', 'DESIGN', 'Testing'];
    const normalized = normalizeTags(tags);
    expect(normalized).toEqual(['development', 'design', 'testing']);
  });

  it('should remove duplicates', () => {
    const tags = ['dev', 'Dev', 'DEV', 'design'];
    const normalized = normalizeTags(tags);
    expect(normalized).toEqual(['dev', 'design']);
  });

  it('should filter out empty tags', () => {
    const tags = ['dev', '', '  ', 'design'];
    const normalized = normalizeTags(tags);
    expect(normalized).toEqual(['dev', 'design']);
  });

  it('should limit to 10 tags', () => {
    const tags = Array.from({ length: 15 }, (_, i) => `tag${i}`);
    const normalized = normalizeTags(tags);
    expect(normalized.length).toBe(10);
  });
});

describe('entrySchema', () => {
  it('should validate valid entry data', () => {
    const validData = {
      week_start: '2025-01-20', // Monday
      hours: 8,
      tags: ['development', 'testing'],
      note: 'Worked on feature X',
      contributor_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = entrySchema.parse(validData);
    expect(result.week_start).toBe('2025-01-20');
    expect(result.hours).toBe(8);
  });

  it('should auto-adjust week_start to Monday', () => {
    const data = {
      week_start: '2025-01-22', // Wednesday
      hours: 5,
      tags: [],
      note: '',
      contributor_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = entrySchema.parse(data);
    expect(result.week_start).toBe('2025-01-20'); // Previous Monday
  });

  it('should reject hours > 100', () => {
    const data = {
      week_start: '2025-01-20',
      hours: 150,
      tags: [],
      note: '',
      contributor_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => entrySchema.parse(data)).toThrow();
  });

  it('should reject negative hours', () => {
    const data = {
      week_start: '2025-01-20',
      hours: -5,
      tags: [],
      note: '',
      contributor_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => entrySchema.parse(data)).toThrow();
  });

  it('should normalize tags', () => {
    const data = {
      week_start: '2025-01-20',
      hours: 8,
      tags: ['  Dev  ', 'TESTING', 'dev'],
      note: '',
      contributor_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = entrySchema.parse(data);
    expect(result.tags).toEqual(['dev', 'testing']);
  });
});
