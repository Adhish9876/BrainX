/** Create an isolated test copy. Never writes fixtures into the real repository. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = fileURLToPath(new URL('..', import.meta.url));
const parent = path.join(os.tmpdir(), 'opencode');
await fs.mkdir(parent, { recursive: true });
const root = await fs.mkdtemp(path.join(parent, 'brainx-fixtures-'));
await fs.chmod(root, 0o700);
await fs.cp(source, root, {
  recursive: true,
  filter(file) {
    return !path.relative(source, file).split(path.sep).some(part =>
      ['.git', 'node_modules', '.uploads', 'test-results', 'playwright-report'].includes(part) ||
      part.startsWith('.next') || (part.startsWith('.env') && part !== '.env.example'));
  },
});
await fs.symlink(path.join(source, 'node_modules'), path.join(root, 'node_modules'), 'junction');
const save = (name, value) => fs.writeFile(path.join(root, 'data', name), `${JSON.stringify(value, null, 2)}\n`);
const multiple = `qa-multiple-${path.basename(root).slice(-6)}`;
const single = `qa-single-${path.basename(root).slice(-6)}`;
await fs.mkdir(path.join(root, 'data/pictures', multiple), { recursive: true });
await fs.mkdir(path.join(root, 'data/pictures', single), { recursive: true });
for (const [file, color] of [['image0.png', '#2C4A87'], ['image1.png', '#e4eaf5']]) {
  await sharp({ create: { width: 720, height: 480, channels: 3, background: color } }).png().toFile(path.join(root, 'data/pictures', multiple, file));
}
await fs.copyFile(path.join(root, 'data/pictures', multiple, 'image0.png'), path.join(root, 'data/pictures', single, 'image0.png'));
await save(`pictures/${multiple}/meta.json`, { name: 'Multiple-image local fixture', date: '', description: 'Local test only.', thumbnail: 'image1.png' });
await save(`pictures/${single}/meta.json`, { name: 'Single-image local fixture', date: '', description: 'Local test only.', thumbnail: 'image0.png' });
await save('pictures.json', [multiple, single]);
await save('news.json', Array.from({ length: 11 }, (_, i) => ({ id: `fixture-news-${i}`, title: `Local test announcement ${String(i + 1).padStart(2, '0')}`, date: `2026-10-${String(i + 1).padStart(2, '0')}`, description: 'Local-only test fixture. Not a real lab announcement.', tags: ['Custom, arbitrary / 任意'], link: '' })));
await save('events.json', [
  { id: 'fixture-archive', title: 'Local historical event', date: '2026-09-10', time: '14:00 IST', venue: 'Historical fixture venue', description: 'Historical fixture description.', image: `/media/pictures/${multiple}/image0.webp`, tags: ['Fixture'], link: 'https://example.com/fixture-archive' },
  { id: 'fixture-latest', title: 'Local featured event', date: '2026-10-10', time: '10:00–12:00 IST (text)', venue: 'Fixture auditorium', description: 'Local-only featured event fixture.', image: `/media/pictures/${multiple}/image1.webp`, tags: ['Fixture'], link: 'https://example.com/fixture-latest' },
]);
await save('projects.json', [{ id: 'fixture-project', title: 'Local fixture project', description: 'Local-only project fixture, not a real lab project.', tags: ['Custom, arbitrary / 任意'], image: `/media/pictures/${multiple}/image0.webp`, link: 'https://example.com/fixture-project' }]);
console.log(root);
