'use client'

import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { he } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
    'he': he,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

// Custom messages for Hebrew
const messages = {
    allDay: 'כל היום',
    previous: 'הקודם',
    next: 'הבא',
    today: 'היום',
    month: 'חודש',
    week: 'שבוע',
    day: 'יום',
    agenda: 'סדר יום',
    date: 'תאריך',
    time: 'שעה',
    event: 'אירוע',
    noEventsInRange: 'אין אירועים בטווח זה',
    showMore: (total: number) => `+${total} נוספים`,
}

export function ManagementCalendar({ tasks, onTaskClick }: { tasks: any[], onTaskClick?: (task: any) => void }) {
    // Map tasks to events
    const events = tasks
        .filter(t => t.dueDate)
        .map(t => ({
            id: t.id,
            title: t.title,
            start: new Date(t.dueDate),
            end: new Date(t.dueDate),
            allDay: true,
            resource: t
        }))

    return (
        <Card className="p-6 h-[700px] shadow-sm direction-rtl text-right">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                culture="he"
                messages={messages}
                rtl={true}
                views={['month']}
                onSelectEvent={(event: any) => onTaskClick?.(event.resource)}
                components={{
                    toolbar: (props: any) => {
                        return (
                            <div className="rbc-toolbar">
                                <span className="rbc-btn-group">
                                    <button type="button" onClick={() => props.onNavigate('PREV')}>הקודם</button>
                                    <button type="button" onClick={() => props.onNavigate('NEXT')}>הבא</button>
                                </span>
                                <span className="rbc-toolbar-label">{props.label}</span>
                                <span className="rbc-btn-group">
                                    {/* Month/Week buttons removed */}
                                </span>
                            </div>
                        )
                    }
                }}
                eventPropGetter={(event) => {
                    const statusColors: any = {
                        'DONE': '#00C875',
                        'IN_PROGRESS': '#FDAB3D',
                        'STUCK': '#E2445C',
                        'TODO': '#C4C4C4',
                    }
                    return {
                        style: {
                            backgroundColor: statusColors[event.resource.status] || '#3174ad',
                            borderRadius: '4px',
                            opacity: 0.8,
                            color: 'white',
                            border: '0px',
                            display: 'block'
                        }
                    }
                }}
            />
        </Card>
    )
}
