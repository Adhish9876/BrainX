import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const source = readFileSync('initial_data.md', 'utf8');

describe('supplied source fidelity', () => {
  it('preserves the original source document, including its repeated record', () => {
    for (const year of [2026, 2025, 2024, 2023, 2022, 2020, 2019, 2018]) expect(source).toContain(`### **${year}**`);
    expect(source.match(/\*\*Type 2 diabetes data classification using stacked autoencoders in deep neural networks\*\*/g)).toHaveLength(2);
  });
  it('includes all supplied team identities and both Yogeshwari roles', () => {
    for (const name of ['Kannadasan', 'Yogeshwari', 'Nidhish', 'Sakthi', 'Adhishwar', 'Shashank', 'Ananthapadmanabhan', 'Athidathan', 'Hamesh', 'Suvanesh']) {
      expect(source.toLowerCase()).toContain(name.toLowerCase());
    }
    expect(source.match(/Yogeshwari R/g)).toHaveLength(2);
  });
});
