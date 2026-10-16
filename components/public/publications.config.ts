/**
 * Images shown on the empty side of each year in the Publications timeline.
 *
 * Add a photo per year here (put the file under /public, e.g. /media/publications/2025.webp):
 *   2025: '/media/publications/2025.webp',
 * Years without an entry use the fallback photos below, in rotation.
 */
export const publicationYearImages: Record<number, string> = {};

export const publicationFallbackImages: string[] = [
  '/media/pictures/demo_pic/photo-01.webp',
  '/media/pictures/demo_pic/photo-05.webp',
  '/media/pictures/demo_pic/photo-03.webp',
  '/media/pictures/demo_pic/photo-07.webp',
  '/media/pictures/demo_pic/photo-02.webp',
];
