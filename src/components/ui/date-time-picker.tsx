"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
    const [timeValue, setTimeValue] = React.useState<string>(
        date ? format(date, "HH:mm") : "12:00"
    )
    const [isOpen, setIsOpen] = React.useState(false)

    // Sync internal state if prop changes externally
    React.useEffect(() => {
        if (date) {
            setSelectedDate(date)
            setTimeValue(format(date, "HH:mm"))
        }
    }, [date])

    const handleDateSelect = (newDate: Date | undefined) => {
        if (!newDate) return
        setSelectedDate(newDate)

        // Combine new date with existing time
        const [hours, minutes] = timeValue.split(":").map(Number)
        const combined = new Date(newDate)
        combined.setHours(hours)
        combined.setMinutes(minutes)

        setDate(combined)
        // Don't close yet, let them pick time? Or close?
        // User complaint was "doesn't close". Let's keep it open for time adjustment 
        // BUT checking "Done" button or similar might be better.
        // For now, let's keep it open to adjust time, but adding a "Listo" button.
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value
        setTimeValue(time)

        if (selectedDate) {
            const [hours, minutes] = time.split(":").map(Number)
            const combined = new Date(selectedDate)
            combined.setHours(hours || 0)
            combined.setMinutes(minutes || 0)
            setDate(combined)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy HH:mm") : <span>Seleccionar fecha y hora</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                />
                <div className="p-3 border-t border-border flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <Input
                        type="time"
                        value={timeValue}
                        onChange={handleTimeChange}
                        className="w-full"
                    />
                </div>
                <div className="p-2 border-t border-border">
                    <Button size="sm" className="w-full" onClick={() => setIsOpen(false)}>
                        Listo
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
