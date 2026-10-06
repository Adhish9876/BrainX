export type NavItem = { href: string; label: string };

/** Public navigation, kept in one place for the header and footer. */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/research', label: 'Research' },
  { href: '/publications', label: 'Publications' },
  { href: '/team', label: 'Team' },
  { href: '/projects', label: 'Projects' },
  { href: '/events', label: 'Events & News' },
  { href: '/pictures', label: 'Pictures' },
];

/** True when `pathname` is inside the section for `href`. */
export function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
