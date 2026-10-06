import { expect, it } from 'vitest';
import { getContent } from '../lib/content';
import { validateContent } from '../lib/validation';

it('accepts arbitrary long tag strings without category or length validation', () => {
  const content = getContent();
  content.research = [{ id: 'tag-test', title: 'Test', description: '', tags: ['Anything, even / 任意', 'a'.repeat(500), '', 'Journal', 'journal', '<untrusted text>'] }];
  const result = validateContent(content);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.content.research[0].tags).toEqual(content.research[0].tags);
});
