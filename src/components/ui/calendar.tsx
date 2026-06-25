'use client'

import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

function Calendar({
  className,
  classNames,
  style,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays
      className={cn('p-2 font-(--f) text-(--t1)', className)}
      classNames={{
        month_caption: 'rdp-month_caption text-[13px] font-semibold',
        button_previous: 'rdp-button_previous rounded-(--r) hover:bg-(--bg2)',
        button_next: 'rdp-button_next rounded-(--r) hover:bg-(--bg2)',
        weekday: 'rdp-weekday text-[11px] font-medium uppercase tracking-[0.4px] text-(--t2)',
        day_button: 'rdp-day_button text-[13px] hover:bg-(--bg2)',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <IconChevronLeft className="h-4 w-4" />
          ) : (
            <IconChevronRight className="h-4 w-4" />
          ),
      }}
      style={
        {
          '--rdp-accent-color': 'var(--blue)',
          '--rdp-accent-background-color': 'var(--blue-bg)',
          '--rdp-today-color': 'var(--blue)',
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Calendar }
