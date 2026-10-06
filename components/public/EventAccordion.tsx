'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ArrowUpRight, CalendarDays, ChevronDown, Clock, MapPin } from 'lucide-react';
import type { Event } from '@/lib/types';
import { formatDate } from './format';
import TagList from './TagList';

function EventDetails({ event, featured = false }: { event: Event; featured?: boolean }) {
  const date = formatDate(event.date);
  return (
    <div className={event.image ? 'grid gap-6 lg:grid-cols-2' : ''}>
      {event.image ? (
        <div className="flex items-start justify-center rounded-md border border-rule bg-navy-50 p-3">
          <img src={event.image} alt={event.title} loading="lazy" className="max-h-[32rem] w-full rounded object-contain" />
        </div>
      ) : null}
      <div className="min-w-0">
        {featured ? <h2 className="font-display text-2xl leading-snug text-ink md:text-3xl">{event.title}</h2> : null}
        <dl className="mt-4 space-y-3 text-sm text-muted">
          {date ? <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-navy-600" aria-hidden /><dt className="sr-only">Date</dt><dd>{date}</dd></div> : null}
          {event.time ? <div className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-navy-600" aria-hidden /><dt className="sr-only">Time</dt><dd>{event.time}</dd></div> : null}
          {event.venue ? <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-navy-600" aria-hidden /><dt className="sr-only">Venue</dt><dd>{event.venue}</dd></div> : null}
        </dl>
        {event.description ? <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted">{event.description}</p> : null}
        <TagList tags={event.tags} className="mt-5" />
        {event.link ? <a href={event.link} target="_blank" rel="noopener noreferrer" className="link-arrow mt-5 text-sm">More info<ArrowUpRight className="h-4 w-4" aria-hidden /></a> : null}
      </div>
    </div>
  );
}

/** Latest event stays fully visible; previous events expand independently. */
export default function EventAccordion({ events }: { events: Event[] }) {
  const [latest, ...previous] = [...events].sort((a, b) => b.date.localeCompare(a.date));
  if (!latest) return null;
  return (
    <div className="space-y-10">
      <article className="card p-5 md:p-8">
        <p className="eyebrow mb-5">Latest event</p>
        <EventDetails event={latest} featured />
      </article>
      {previous.length ? <section aria-labelledby="past-events">
        <h2 id="past-events" className="mb-5 font-display text-xl text-ink">Previous events</h2>
        <Accordion.Root type="multiple" className="divide-y divide-rule border-y border-rule">
          {previous.map(event => <Accordion.Item key={event.id} value={event.id}>
            <Accordion.Header>
              <Accordion.Trigger className="flex w-full items-start justify-between gap-4 py-5 text-left hover:text-navy-700 [&[data-state=open]>svg]:rotate-180">
                <span className="min-w-0 flex-1">
                  {event.date ? <time dateTime={event.date} className="text-xs uppercase tracking-wider text-muted">{formatDate(event.date)}</time> : null}
                  <span className="mt-2 block font-display text-xl leading-snug text-ink">{event.title}</span>
                </span>
                <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-navy-500" aria-hidden />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="pb-6"><EventDetails event={event} /></Accordion.Content>
          </Accordion.Item>)}
        </Accordion.Root>
      </section> : null}
    </div>
  );
}
