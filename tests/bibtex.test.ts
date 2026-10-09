import { describe, expect, it } from 'vitest';
import { MAX_BIBTEX_LENGTH, parsePublicationBibtex, toPlainText } from '../components/admin/lib/bibtex';

describe('parsePublicationBibtex', () => {
  it('maps a full @article into editable fields (URL preferred over DOI)', () => {
    const result = parsePublicationBibtex(`@article{smith2020,
  author = {Smith, John A. and Doe, Jane},
  title = {A {Great} Study of {DNA}},
  journal = {Journal of {Important} Things},
  year = {2020},
  doi = {10.1000/xyz123},
  url = {https://example.com/paper},
  keywords = {genetics, biology; dna}
}`);

    expect(result.fields).toEqual({
      title: 'A Great Study of DNA',
      authors: 'John A. Smith, Jane Doe',
      year: 2020,
      venue: 'Journal of Important Things',
      link: 'https://example.com/paper',
      tags: ['genetics', 'biology', 'dna'],
    });
    expect(result.warnings).toEqual([]);
  });

  it('handles @inproceedings with nested braces, quotes and an "others" author', () => {
    const result = parsePublicationBibtex(`@inproceedings{lee2019,
  author = {Lee, Bob and others},
  title = "Nested {Braces} and {Mixed} Case",
  booktitle = {Proceedings of the {ACM} Conference},
  year = {2019},
  publisher = {ACM Press}
}`);

    expect(result.fields.title).toBe('Nested Braces and Mixed Case');
    expect(result.fields.authors).toBe('Bob Lee, et al.');
    expect(result.fields.venue).toBe('Proceedings of the ACM Conference');
    expect(result.fields.year).toBe(2019);
  });

  it('falls back to the publisher when there is no journal or booktitle', () => {
    const result = parsePublicationBibtex(`@book{big2000,
  author = {Alpha, Ann},
  title = {A Book},
  publisher = {Big Press},
  year = {2000}
}`);

    expect(result.fields.venue).toBe('Big Press');
    expect(result.fields.year).toBe(2000);
  });

  it('decodes LaTeX accents in names and titles', () => {
    const result = parsePublicationBibtex(String.raw`@article{muller1999,
  author = {M{\"u}ller, Hans},
  title = {Caf\'e and na{\"i}ve r\'esum\'e},
  journal = {Zeitschrift},
  year = {1999}
}`);

    expect(result.fields.authors).toBe('Hans Müller');
    expect(result.fields.title).toBe('Café and naïve résumé');
  });

  it('resolves @string, comments and concatenation', () => {
    const result = parsePublicationBibtex(`% a leading comment
@string{jn = "Journal of Testing"}
@string{pub = {Big Press}}
@article{key2021,
  author = {Alpha, A. and Beta, B.},
  title = {Concatenated Study},
  journal = jn # " Extra",
  publisher = pub,
  year = 2021
}`);

    expect(result.fields.venue).toBe('Journal of Testing Extra');
    expect(result.fields.year).toBe(2021);
    expect(result.fields.authors).toBe('A. Alpha, B. Beta');
  });

  it('renders readable author names with particles and suffixes', () => {
    const result = parsePublicationBibtex(`@article{names2020,
  author = {van der Berg, Jan and de la Cruz, Maria and Smith, Jr., John and {World Health Organization}},
  title = {Names},
  journal = {J},
  year = {2020}
}`);

    expect(result.fields.authors).toBe('Jan van der Berg, Maria de la Cruz, John Smith Jr., World Health Organization');
  });

  it('strips Citation.js CSL HTML markup from titles without rendering it', () => {
    const result = parsePublicationBibtex(String.raw`@article{markup2020,
  author = {Smith, J.},
  title = {The \textsc{small caps} and \emph{emphasis} and H\textsubscript{2}O},
  journal = {J},
  year = {2020}
}`);

    expect(result.fields.title).toBe('The small caps and emphasis and H2O');
    expect(result.fields.title).not.toMatch(/[<>]/);
  });

  it('preserves the casing of titles', () => {
    const result = parsePublicationBibtex(`@article{case2020,
  author = {A, B},
  title = {The iPhone and NASA and CamelCase},
  journal = {J},
  year = {2020}
}`);

    expect(result.fields.title).toBe('The iPhone and NASA and CamelCase');
  });

  it('reads the year from the issued date', () => {
    const result = parsePublicationBibtex(`@article{y2020, author={A, B}, title={T}, journal={J}, year={2020}}`);
    expect(result.fields.year).toBe(2020);
  });

  it('warns and omits an out-of-range year', () => {
    const result = parsePublicationBibtex(`@article{old, author={A, B}, title={T}, journal={J}, year={1850}}`);
    expect(result.fields.year).toBeUndefined();
    expect(result.warnings.join(' ')).toMatch(/1850/);
    expect(result.warnings.join(' ')).toMatch(/1900-2100/);
  });

  it('falls back to an https://doi.org/ link when there is no URL', () => {
    const result = parsePublicationBibtex(`@article{doi2020, author={A, B}, title={T}, journal={J}, year={2020}, doi={10.1000/abc}}`);
    expect(result.fields.link).toBe('https://doi.org/10.1000/abc');
  });

  it('keeps a DOI that is already a full https URL', () => {
    const result = parsePublicationBibtex(`@article{doi2020, author={A, B}, title={T}, journal={J}, year={2020}, doi={https://doi.org/10.1000/abc}}`);
    expect(result.fields.link).toBe('https://doi.org/10.1000/abc');
  });

  it('ignores unsafe URLs and warns instead of emitting them', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'ftp://example.com/x']) {
      const result = parsePublicationBibtex(`@article{u, author={A, B}, title={T}, journal={J}, year={2020}, url={${url}}}`);
      expect(result.fields.link).toBeUndefined();
      expect(result.warnings.some(warning => /URL/.test(warning))).toBe(true);
    }
  });

  it('uses a valid DOI when the URL is unsafe', () => {
    const result = parsePublicationBibtex(
      `@article{u, author={A, B}, title={T}, journal={J}, year={2020}, url={javascript:alert(1)}, doi={10.1000/ok}}`,
    );
    expect(result.fields.link).toBe('https://doi.org/10.1000/ok');
  });

  it('maps keywords (including @string concatenation) to tags', () => {
    const result = parsePublicationBibtex(`@string{kw = "alpha, beta"}
@article{k, author={A, B}, title={T}, journal={J}, year={2020}, keywords = kw # ", gamma"}`);
    expect(result.fields.tags).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('omits tags when no keywords are present', () => {
    const result = parsePublicationBibtex(`@article{k, author={A, B}, title={T}, journal={J}, year={2020}}`);
    expect('tags' in result.fields).toBe(false);
  });

  it('never emits or changes an id', () => {
    const result = parsePublicationBibtex(`@article{somekey, author={A, B}, title={T}, journal={J}, year={2020}}`);
    expect('id' in result.fields).toBe(false);
  });

  it('preserves absent fields for partial citations without throwing', () => {
    const result = parsePublicationBibtex(`@misc{partial, title={Only a Title}}`);
    expect(result.fields).toEqual({ title: 'Only a Title' });
    expect('authors' in result.fields).toBe(false);
    expect('year' in result.fields).toBe(false);
    expect('venue' in result.fields).toBe(false);
    expect('link' in result.fields).toBe(false);
    expect(result.warnings.join(' ')).toMatch(/Not extracted: authors, year, venue/);
  });

  it('returns no fields and a warning for a citation with nothing recognizable', () => {
    const result = parsePublicationBibtex(`@misc{notes, note={Just a note}}`);
    expect(result.fields).toEqual({});
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('warns and omits an over-long title', () => {
    const longTitle = 'A'.repeat(501);
    const result = parsePublicationBibtex(`@article{long, author={A, B}, title={${longTitle}}, journal={J}, year={2020}}`);
    expect(result.fields.title).toBeUndefined();
    expect(result.warnings.join(' ')).toMatch(/title/i);
  });

  it('warns and omits an over-long author list', () => {
    const authors = Array.from({ length: 200 }, (_value, index) => `Family${index}, Given${index}`).join(' and ');
    const result = parsePublicationBibtex(`@article{many, author={${authors}}, title={T}, journal={J}, year={2020}}`);
    expect(result.fields.authors).toBeUndefined();
    expect(result.warnings.join(' ')).toMatch(/author/i);
  });

  describe('rejections', () => {
    it('rejects empty and whitespace-only input', () => {
      expect(() => parsePublicationBibtex('')).toThrow(/Paste a BibTeX citation/);
      expect(() => parsePublicationBibtex('   \n\t ')).toThrow(/Paste a BibTeX citation/);
    });

    it('rejects malformed input with a safe message that does not echo the input', () => {
      let message = '';
      try {
        parsePublicationBibtex('@article{broken, title = {Unclosed');
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      expect(message).toMatch(/could not be parsed/);
      expect(message).not.toMatch(/Unclosed/);
    });

    it('rejects input with no citation', () => {
      expect(() => parsePublicationBibtex('@string{jn = "J"}')).toThrow(/No BibTeX citation/);
      expect(() => parsePublicationBibtex('% only a comment')).toThrow(/No BibTeX citation/);
    });

    it('rejects more than one citation instead of importing the first', () => {
      expect(() =>
        parsePublicationBibtex('@article{a1, title={One}, year={2020}}\n@article{a2, title={Two}, year={2021}}'),
      ).toThrow(/exactly one BibTeX citation/);
    });

    it('rejects a paste larger than the size bound', () => {
      expect(() => parsePublicationBibtex('x'.repeat(MAX_BIBTEX_LENGTH + 1))).toThrow(/too large/);
    });
  });
});

describe('toPlainText', () => {
  it('returns an empty string for non-string input', () => {
    expect(toPlainText(undefined)).toBe('');
    expect(toPlainText(null)).toBe('');
    expect(toPlainText(42)).toBe('');
  });

  it('strips tags, decodes entities and collapses whitespace', () => {
    expect(toPlainText('<span style="font-variant:small-caps;">x</span> &amp; &lt;i&gt;y&lt;/i&gt; &#65;')).toBe('x & y A');
    expect(toPlainText('H<sub>2</sub>O   and\n more')).toBe('H2O and more');
    expect(toPlainText('a < b > c')).toBe('a < b > c');
  });
});
