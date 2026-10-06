# Reference website research

**Reference:** https://labs.iitgn.ac.in/haix/ (HAIx Lab, IIT Gandhinagar)  
**Inspected:** 7 October 2026 — homepage and all six supplied page URLs, plus their shared CSS, JavaScript and footer component.

Evidence labels: **Observed** means directly present in retrieved HTML/CSS/JavaScript. **Inferred** denotes interpretation. Browser rendering encountered Cloudflare verification; HTTP retrieval succeeded. Responsive observations below come from source media queries, not a claimed visual device test.

## Global structure — observed

- WordPress/Divi 4.27.9 supplies the shell; most custom page bodies are HTML inside Divi Code modules. Shared assets are under `/haix/wp-content/haix-assets/`.
- Left logo, right horizontal navigation: Home, Research, Publications, Patents, Team, Resources, Vacancies, Pictures, News & Events. Current-page styling, search icon and fixed header.
- The navigation changes to a hamburger at **1200px**, avoiding crowded links at narrow desktop widths. The logo is constrained to approximately 60px high.
- Content containers have a **1280px maximum width**, generous side padding and section spacing. Repeated patterns include full-width sections, alternating backgrounds, metadata chips and card grids.
- Reference colors are navy `#003366`, tan/gold accents, white/light-gray backgrounds. Its custom content uses Inter; Divi navigation uses Open Sans. These are reference observations, **not BrainX design requirements**.
- Divi's default footer is hidden. A custom fetched footer has a two-column grid: lab brand/copyright on the left, contact address/phone/emails on the right. At 768px it stacks. Some pages use JavaScript to pin the footer when content is short.

## Home — https://labs.iitgn.ac.in/haix/

**Observed:** a `2fr 1fr` main/news grid with roughly 4rem gap.

Left column:
1. Short research-positioning tagline.
2. Lab illustration.
3. Explanatory paragraphs and an inline research link.
4. A section explaining the lab's name, with bullets.
5. Campus/location sentence and a hiring callout.

Right column: latest-news heading, dated entries with category badges and descriptions, followed by “See more news” linking to the full news tab (`/events/?tab=news`). Categories include Publication, News, Award, Team and Event.

At **768px** the columns stack; the news rail follows the lab information. At **480px** reference CSS/JS makes the news list a roughly 220px scrollable area. Research-focus cards, a join-team section and contact form exist only as commented-out markup: they are not active homepage content.

**BrainX adaptation:** lab information only in the main column; a right latest-news/publications rail, latest 10 news entries, and a Show all link. No copied illustration, name explanation, hiring claim or reference text. Prefer normal mobile document flow over a cramped inner scroller.

## Publications — ?page_id=1561

**Observed:** sticky year filter pills, followed by year-grouped publication lists. Years descend from recent to older work. A year label sits on a horizontal rule. Each record contains a numeric thumbnail/counter area, type badge, title, authors, italic venue and paper/Scholar/DOI links. There are 68 reference entries, including several publication categories. Some links are disabled when unavailable.

At **768px**, year pills form a horizontally scrollable row; cards remain readable with smaller metadata. Smaller typography at 480px.

**BrainX adaptation:** a restrained year timeline, year anchors and title/authors/venue/free-form tags/source link from `initial_data.md`. Do not fabricate PDF, Scholar or DOI links. Preserve the source's repeated 2018/2019 publication until an administrator chooses otherwise.

## Team — ?page_id=1678

**Observed:** roster sections grouped by role, in order: Principal Investigator, Post Doctoral Fellows, Project Staff, PhD Scholars, Masters Students, Bachelors Students, Alumni.

- PI uses a prominent horizontal portrait/bio card, approximately 220px square portrait, designation and profile links.
- Other members use smaller portrait/name/role/duration/education/profile-link cards, in `auto-fill` grids with a 320px minimum.
- The reference includes recruitment placeholder cards and alumni tables. These are content choices, not necessary BrainX features.
- PI layout stacks around 992px; member grid becomes one column at 768px; member cards stack portrait/text at 480px. Wide alumni tables scroll horizontally.

**BrainX adaptation:** prominent PI biography and grouped members from the supplied source, initials when photos are absent. Retain Yogeshwari's supplied Project Staff and Research Scholar entries. No invented alumni or recruitment claims.

## Research — ?page_id=1109

**Observed:** a centered image slider above four research-topic cards. Cards contain titles, explanatory paragraphs and topic tags. A navy contact CTA follows. The reference themes span assistive communication, rehabilitation, health sensors/imaging and sustainable interfaces.

Slider image height scales down at 992/768/480px; topic spacing and typography shrink. CTA buttons stack on smaller screens.

**BrainX adaptation:** title/description/tag cards with explicitly marked placeholder topics. Omit the slider and unsupported CTA, prioritizing fast loading and the requested minimal animation.

## Resources → BrainX Projects — ?page_id=1424

**Observed:** sticky All/Dataset/Software filters above project cards. Four active cards are present; equipment examples in the source are commented out. Cards combine a 4:3 image, name, description, category tag and details action. Some actions open complex inlined project microsites inside modal iframes; one opens a dataset modal.

Gallery columns use 300px minimum widths, reducing to 260px at 992px, 220px at 768px, and one column at 480px.

**BrainX adaptation:** simple image/name/description/free-form-tags/external-link project cards. No embedded microsites or copied projects. Empty state until real projects are supplied.

## News & Events — ?page_id=1091

**Observed:** pill tabs for **Events, News, Media**. Events have a large two-column featured-event image/details card and an archive accordion. Expanded entries include descriptive content and links; photos can open an overlay. The reference contains about 58 event accordion items.

News is populated by JavaScript from a text source, with fallback entries, dates, category badges and descriptions. Media has a featured video and press archive. `?tab=news` is used for deep linking.

At 992px featured events stack; at 768px tabs scroll horizontally and accordion spacing shrinks; at 480px images stack further.

**Observed anomaly:** the events stylesheet hides the global Divi header, unlike other pages. **Inferred:** probably an override artifact rather than a pattern to reproduce.

**BrainX adaptation:** only Events and News tabs, consistent global navigation, all news on the News tab. Latest event fully expanded, older events in accessible accordions. Event fields: image, title, date, time text, venue, description, link; action named “More info.” No invented event history or media tab.

## Pictures — ?page_id=1099

**Observed:** category filters above a thumbnail-card grid. Five reference groups represent events, celebrations, lab photos and visits. Each card has an image, name, category and sometimes a photo count.

The lightbox has previous/next controls, close button, counter and caption. Keyboard navigation is implemented; navigation is hidden for a single image. Grid breakpoints mirror Resources. Overlay controls become smaller/inset on mobile.

**BrainX adaptation:** directory-backed groups (`data/pictures/<id>/meta.json` plus raster files), chosen thumbnail, event name/date/description, and aspect-ratio-preserving accessible image dialog with arrow-key navigation. No reference images are reused.

## Design decisions for BrainX

- Adopt the shell, main/news asymmetry, year grouping, role grouping, card grids, tabs, accordion hierarchy and photo-overlay interaction.
- Keep the BrainX identity distinct: navy **#2C4A87**, light-only restrained academic editorial typography, placeholder monogram logo and very little animation.
- Preserve navigation on every page; use CSS layout rather than fetched HTML/footer-position scripts.
- Build public pages from repository data at compile time, unlike the reference's mixed runtime fetches.
- Add a separate hidden `/admin` GitHub-backed CMS; the reference's CMS and content must not be copied.
- No extra patents, vacancies, search, media, recruitment, institutional contact details or reference lab text are implied by this research.
