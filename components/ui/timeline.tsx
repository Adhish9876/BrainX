import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TimelineProps extends React.HTMLAttributes<HTMLUListElement> {
  position?: 'left' | 'right' | 'alternate';
}

export const Timeline = React.forwardRef<HTMLUListElement, TimelineProps>(
  ({ className, children, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn('MuiTimeline-root flex flex-col m-0 p-0 list-none', className)}
      {...props}
    >
      {children}
    </ul>
  ),
);
Timeline.displayName = 'Timeline';

export interface TimelineItemProps extends React.LiHTMLAttributes<HTMLLIElement> {}

export const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
  ({ className, children, ...props }, ref) => (
    <li
      ref={ref}
      className={cn('MuiTimelineItem-root relative flex min-h-[70px] list-none', className)}
      {...props}
    >
      {children}
    </li>
  ),
);
TimelineItem.displayName = 'TimelineItem';

export interface TimelineSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TimelineSeparator = React.forwardRef<HTMLDivElement, TimelineSeparatorProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('MuiTimelineSeparator-root flex flex-col items-center shrink-0', className)}
      {...props}
    >
      {children}
    </div>
  ),
);
TimelineSeparator.displayName = 'TimelineSeparator';

export interface TimelineDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'filled' | 'outlined';
  color?: 'default' | 'primary' | 'secondary';
}

export const TimelineDot = React.forwardRef<HTMLSpanElement, TimelineDotProps>(
  ({ className, variant = 'filled', color = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'MuiTimelineDot-root flex h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0 rounded-full my-2 shadow-xs transition-colors',
        variant === 'outlined'
          ? 'border-2 bg-paper border-slate-400'
          : color === 'primary'
            ? 'bg-[#1e96f0] ring-[6px] ring-[#1e96f0]/20'
            : 'bg-slate-400 ring-4 ring-slate-400/15',
        className,
      )}
      {...props}
    />
  ),
);
TimelineDot.displayName = 'TimelineDot';

export interface TimelineConnectorProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const TimelineConnector = React.forwardRef<HTMLSpanElement, TimelineConnectorProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('MuiTimelineConnector-root w-[2.5px] grow bg-slate-300', className)}
      {...props}
    />
  ),
);
TimelineConnector.displayName = 'TimelineConnector';

export interface TimelineContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('MuiTimelineContent-root flex-1 py-0.5 pl-6 sm:pl-9 pb-10 text-left', className)}
      {...props}
    >
      {children}
    </div>
  ),
);
TimelineContent.displayName = 'TimelineContent';

export interface TimelineOppositeContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TimelineOppositeContent = React.forwardRef<
  HTMLDivElement,
  TimelineOppositeContentProps
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'MuiTimelineOppositeContent-root shrink-0 py-0.5 pr-6 sm:pr-9 text-right',
      className,
    )}
    {...props}
  >
    {children}
  </div>
));
TimelineOppositeContent.displayName = 'TimelineOppositeContent';

export default Timeline;
