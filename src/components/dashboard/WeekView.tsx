'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CalendarEvent } from '@/types';

export function WeekView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchWeekEvents();
  }, []);

  const fetchWeekEvents = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Get start and end of current week
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const weekStart = new Date(today);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .or(`and(start_date.gte.${weekStart.toISOString()},start_date.lte.${weekEnd.toISOString()}),and(end_date.gte.${weekStart.toISOString()},end_date.lte.${weekEnd.toISOString()}),and(start_date.lte.${weekStart.toISOString()},end_date.gte.${weekEnd.toISOString()})`)
      .order('start_date', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }

    setLoading(false);
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = new Date(event.start_date);
      const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;

      // Normalize dates to compare only date parts
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(23, 59, 59, 999);

      // Event is visible on this date if the date falls between start and end
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  const getCurrentWeekDays = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const weekStart = new Date(today);
    weekStart.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDays.push(date);
    }
    return weekDays;
  };

  const weekDays = getCurrentWeekDays();
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">Loading events...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} -{' '}
          {weekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isToday =
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear();

            return (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div
                  className={`p-2 border-b text-center ${
                    isToday ? 'bg-blue-50 text-blue-600 font-semibold' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-xs">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-semibold">{date.getDate()}</div>
                </div>
                <div className="p-2 min-h-[120px] max-h-[200px] overflow-y-auto">
                  <div className="space-y-1">
                    {dayEvents.length === 0 ? (
                      <div className="text-xs text-gray-400 text-center py-2">No events</div>
                    ) : (
                      dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-2 rounded cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: event.color || '#3b82f6', color: 'white' }}
                          onClick={() => window.location.href = '/dashboard/calendar'}
                        >
                          <div className="font-semibold truncate">{event.title}</div>
                          <div className="text-xs opacity-90">
                            {new Date(event.start_date).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
