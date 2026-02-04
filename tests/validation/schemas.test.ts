import { describe, it, expect } from 'vitest';
import {
  formatDateISO,
  normalizeTags,
  entrySchema,
} from '@/lib/validation/schemas';

describe('formatDateISO', () => {
  it('should format date as YYYY-MM-DD', () => {
    const date = new Date('2025-01-22T00:00:00Z');
    expect(formatDateISO(date)).toBe('2025-01-22');
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
      week_start: '2025-01-20',
      hours: 8,
      tags: ['development', 'testing'],
      note: 'Worked on feature X',
      contributor_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = entrySchema.parse(validData);
    expect(result.week_start).toBe('2025-01-20');
    expect(result.hours).toBe(8);
  });

  it('should preserve the exact date without rounding to Monday', () => {
    const data = {
      week_start: '2025-01-22', // Wednesday - should stay as Wednesday
      hours: 5,
      tags: [],
      note: '',
      contributor_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = entrySchema.parse(data);
    expect(result.week_start).toBe('2025-01-22'); // Preserved as-is
  });

  it('should preserve Sunday date without rounding', () => {
    const data = {
      week_start: '2026-02-01', // Sunday - the reported bug case
      hours: 3,
      tags: [],
      note: '',
      contributor_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = entrySchema.parse(data);
    expect(result.week_start).toBe('2026-02-01'); // Must NOT become 2026-01-26
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
