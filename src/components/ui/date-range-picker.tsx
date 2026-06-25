'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { IconCalendar } from '@tabler/icons-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function DateRangePicker({
  value,
  onChange,
  placeholder = 'Selecciona un rango',
  className,
  disabled,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const label = value?.from
    ? value.to
      ? `${format(value.from, 'dd/MM/yyyy', { locale: es })} - ${format(value.to, 'dd/MM/yyyy', { locale: es })}`
      : format(value.from, 'dd/MM/yyyy', { locale: es })
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-(--r) border border-(--bm) bg-(--bg) px-2.25 py-1.75 font-(--f) text-[13px] text-(--t1) outline-none transition-colors hover:border-(--blue) focus:border-(--blue) disabled:cursor-not-allowed disabled:opacity-50',
            !value?.from && 'text-(--t3)',
            className
          )}
        >
          {label}
          <IconCalendar className="h-4 w-4 shrink-0 text-(--t2)" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={value}
          onSelect={onChange}
          locale={es}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DateRangePicker }
