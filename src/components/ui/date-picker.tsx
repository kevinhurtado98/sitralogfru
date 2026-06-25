'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { IconCalendar } from '@tabler/icons-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function DatePicker({
  value,
  onChange,
  placeholder = 'Selecciona una fecha',
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-(--r) border border-(--bm) bg-(--bg) px-2.25 py-1.75 font-(--f) text-[13px] text-(--t1) outline-none transition-colors hover:border-(--blue) focus:border-(--blue) disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-(--t3)',
            className
          )}
        >
          {value ? format(value, 'dd/MM/yyyy', { locale: es }) : placeholder}
          <IconCalendar className="h-4 w-4 shrink-0 text-(--t2)" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          locale={es}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
