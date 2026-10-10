/**
 * Home hero photograph — the one place to swap the team photo.
 *
 * To replace the placeholder: drop the real photo in `public/images/`
 * (landscape, ideally >= 2400px wide, JPG/WebP), then change `src` below.
 * Adjust `positionMobile` / `positionDesktop` ("x% y%") so faces stay visible
 * and clear of the text, which sits at the left on desktop and the bottom on mobile.
 */
export const HERO_IMAGE = {
  src: '/images/team-hero.jpg',
  alt: 'BrainX Lab team photograph',
  width: 2400,
  height: 1350,
  positionMobile: '60% 30%',
  positionDesktop: '65% 35%',
  isPlaceholder: true,
} as const;
