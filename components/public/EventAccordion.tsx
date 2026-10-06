'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ArrowUpRight, CalendarDays, ChevronDown, Clock, MapPin } from 'lucide-react';
import type { Event } from '@/lib/types';
import { formatDate } from './format';
import TagList from './TagList';

/**
 * Events list as an accessible accordion. The most recent event is expanded by
 * default; earlier events stay collapsed. Each panel exposes all details.
 */
export default function EventAccordion({ events }: { events: Event[] }) {
  if (events.length === 0) return null;

  const [latest, ...previous] = events;
  const ordered = [latest, ...previous];

  return (
    <Accordion.Root
      type="single"
      collapsible
      defaultValue={latest.id}
      className="divide-y divide-rule border-y border-rule"
    >
      {ordered.map((event, index) => {
        const isLatest = index === 0;
        const date = formatDate(event.date);
        return (
          <Accordion.Item key={event.id} value={event.id} className="group">
            <Accordion.Header>
              <Accordion.Trigger className="flex w-full items-start justify-between gap-4 py-5 text-left transition-colors hover:text-navy-700 [&[data-state=open]>svg]:rotate-180">
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.12em] text-muted">
                    {isLatest ? (
                      <span className="rounded-full bg-navy-700 px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.14em] text-paper">
                        Latest
                      </span>
                    ) : null}
                    {date ? <time dateTime={event.date}>{date}</time> : null}
                  </span>
                  <span className="mt-2 block font-display text-xl leading-snug text-ink">
                    {event.title}
                  </span>
                </span>
                <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-navy-500 transition-transform duration-200" aria-hidden />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="pb-6 pl-0 md:pl-2">
                <div className="grid gap-6 md:grid-cols-[1fr_16rem]">
                  <div>
                    {event.description ? (
                      <p className="text-sm leading-relaxed text-muted">{event.description}</p>
                    ) : null}
                    <TagList tags={event.tags} className="mt-4" />
                    {event.link ? (
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-arrow mt-5 text-sm"
                      >
                        More info
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                  <dl className="space-y-3 text-sm text-muted">
                    {date ? (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-navy-600" aria-hidden />
                        <dt className="sr-only">Date</dt>
                        <dd>{date}</dd>
                      </div>
                    ) : null}
                    {event.time ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-navy-600" aria-hidden />
                        <dt className="sr-only">Time</dt>
                        <dd>{event.time}</dd>
                      </div>
                    ) : null}
                    {event.venue ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-navy-600" aria-hidden />
                        <dt className="sr-only">Venue</dt>
                        <dd>{event.venue}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
}
