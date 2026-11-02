import React, { useEffect, useState } from 'react';
import { interviewService } from '@/services/interviewService';
import { applicationService } from '@/services/applicationService';
import { reminderService } from '@/services/reminderService';
import { Interview, Application, Reminder } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Calendar as CalendarIcon,
  Video,
  Clock,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'INTERVIEW' | 'DEADLINE' | 'REMINDER';
  meta?: any;
}

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const [itRes, appRes, remRes] = await Promise.all([
        interviewService.getInterviews(),
        applicationService.getAllApplications(),
        reminderService.getReminders(false),
      ]);

      const allEvents: CalendarEvent[] = [];

      if (itRes.data) {
        itRes.data.forEach((i) => {
          allEvents.push({
            id: `int_${i.id}`,
            title: `${i.company_name} - ${i.interview_type} (R${i.interview_round})`,
            date: new Date(i.interview_date),
            type: 'INTERVIEW',
            meta: i,
          });
        });
      }

      if (appRes.data) {
        appRes.data.forEach((a) => {
          if (a.deadline) {
            allEvents.push({
              id: `dead_${a.id}`,
              title: `${a.company_name} - Deadline`,
              date: new Date(a.deadline),
              type: 'DEADLINE',
              meta: a,
            });
          }
        });
      }

      if (remRes.data) {
        remRes.data.forEach((r) => {
          allEvents.push({
            id: `rem_${r.id}`,
            title: r.title,
            date: new Date(r.due_date),
            type: 'REMINDER',
            meta: r,
          });
        });
      }

      allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
      setEvents(allEvents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-indigo-400" />
            <span>Interview & Deadline Calendar</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological overview of scheduled rounds, submission deadlines, and follow-ups
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={prevMonth} className="p-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-bold text-white min-w-[140px] text-center font-mono">
            {monthName}
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth} className="p-2">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-2 auto-rows-fr">
          {/* Empty prefix slots */}
          {[...Array(firstDayIndex)].map((_, i) => (
            <div key={`empty_${i}`} className="min-h-24 rounded-xl bg-slate-950/20 border border-transparent p-2" />
          ))}

          {/* Days of Month */}
          {[...Array(daysInMonth)].map((_, i) => {
            const dayNum = i + 1;
            const thisDate = new Date(year, month, dayNum);
            const dayEvents = events.filter((e) => {
              return (
                e.date.getFullYear() === year &&
                e.date.getMonth() === month &&
                e.date.getDate() === dayNum
              );
            });
            const isToday =
              new Date().toDateString() === thisDate.toDateString();

            return (
              <div
                key={`day_${dayNum}`}
                className={`min-h-24 sm:min-h-28 rounded-xl border p-2 flex flex-col justify-between transition-colors ${
                  isToday
                    ? 'border-indigo-500/60 bg-indigo-950/20'
                    : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center'
                        : 'text-slate-400'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  )}
                </div>

                <div className="mt-1 space-y-1 overflow-y-auto max-h-16">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`px-1.5 py-0.5 rounded text-[10px] truncate font-medium flex items-center gap-1 ${
                        ev.type === 'INTERVIEW'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : ev.type === 'DEADLINE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                      title={ev.title}
                    >
                      {ev.type === 'INTERVIEW' ? (
                        <Video className="w-2.5 h-2.5 shrink-0" />
                      ) : ev.type === 'DEADLINE' ? (
                        <Briefcase className="w-2.5 h-2.5 shrink-0" />
                      ) : (
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                      )}
                      <span className="truncate">{ev.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
