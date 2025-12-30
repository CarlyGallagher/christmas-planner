'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import type { CalendarEvent } from '@/types';
import { CreateEventDialog } from '@/components/calendar/CreateEventDialog';
import { EventDetailsDialog } from '@/components/calendar/EventDetailsDialog';
import { DayEventsDialog } from '@/components/calendar/DayEventsDialog';
import { CalendarViewSettings, CalendarView } from '@/components/calendar/CalendarViewSettings';

export default function CalendarPage() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });
  const [calendarView, setCalendarView] = useState<CalendarView>('year');
  const [showViewSettings, setShowViewSettings] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayEventsDialog, setShowDayEventsDialog] = useState(false);
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchEvents();
  }, [currentYear]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents([]);
    }
  }, [searchQuery, events]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // For now, we'll fetch all events for the user
    // In production, you'd want to filter by calendar_id
    const startOfYear = new Date(currentYear, 0, 1).toISOString();
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_date', startOfYear)
      .lte('start_date', endOfYear)
      .order('start_date', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }

    setLoading(false);
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);
      const checkDate = new Date(date);

      // Reset time to midnight for date comparison
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(23, 59, 59, 999);
      checkDate.setHours(12, 0, 0, 0);

      // Event is visible on this date if the date falls between start and end
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  const renderWeekView = () => {
    const weekDays = [];
    const weekStart = new Date(currentWeekStart);

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDays.push(date);
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} -{' '}
            {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
                <div key={index} className="border rounded-lg">
                  <div
                    className={`p-2 border-b text-center ${
                      isToday ? 'bg-blue-50 text-blue-600 font-semibold' : ''
                    }`}
                  >
                    <div className="text-xs">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-lg font-semibold">{date.getDate()}</div>
                  </div>
                  <div
                    className="p-2 min-h-[300px] cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedDate(date);
                      setDayEvents(dayEvents);
                      setShowDayEventsDialog(true);
                    }}
                  >
                    <div className="space-y-2">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-2 rounded"
                          style={{ backgroundColor: event.color || '#3b82f6', color: 'white' }}
                        >
                          <div className="font-semibold truncate">{event.title}</div>
                          <div className="text-xs opacity-90">
                            {new Date(event.start_date).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSingleMonth = (monthIndex: number, year: number) => {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-100"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const dayEvents = getEventsForDate(date);
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 ${
            isToday ? 'bg-blue-50' : ''
          }`}
          onClick={() => {
            setSelectedDate(date);
            setDayEvents(dayEvents);
            setShowDayEventsDialog(true);
          }}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : ''}`}>
            {day}
          </div>
          <div className="space-y-1 pointer-events-none">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="text-xs px-1 py-0.5 rounded truncate"
                style={{ backgroundColor: event.color || '#3b82f6', color: 'white' }}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {new Date(year, monthIndex).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold py-2 border-b">
                {day}
              </div>
            ))}
            {days}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMonth = (monthIndex: number) => {
    const firstDay = new Date(currentYear, monthIndex, 1);
    const lastDay = new Date(currentYear, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const days = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 border border-gray-100"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, monthIndex, day);
      const dayEvents = getEventsForDate(date);
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`h-20 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 ${
            isToday ? 'bg-blue-50' : ''
          }`}
          onClick={() => {
            setSelectedDate(date);
            setDayEvents(dayEvents);
            setShowDayEventsDialog(true);
          }}
        >
          <div className={`text-sm font-semibold ${isToday ? 'text-blue-600' : ''}`}>
            {day}
          </div>
          <div className="space-y-0.5 mt-1 pointer-events-none">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className="text-xs px-1 py-0.5 rounded truncate"
                style={{ backgroundColor: event.color || '#3b82f6', color: 'white' }}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <Card key={monthIndex} className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{monthNames[monthIndex]}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold py-2 border-b">
                {day}
              </div>
            ))}
            {days}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading calendar...</p>
      </div>
    );
  }

  const getHeaderTitle = () => {
    if (calendarView === 'year') {
      return `Calendar ${currentYear}`;
    } else if (calendarView === 'month') {
      return new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    } else {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      return `${currentWeekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })} - ${weekEnd.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`;
    }
  };

  const handlePrevious = () => {
    if (calendarView === 'year') {
      setCurrentYear(currentYear - 1);
    } else if (calendarView === 'month') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      const newWeekStart = new Date(currentWeekStart);
      newWeekStart.setDate(currentWeekStart.getDate() - 7);
      setCurrentWeekStart(newWeekStart);
    }
  };

  const handleNext = () => {
    if (calendarView === 'year') {
      setCurrentYear(currentYear + 1);
    } else if (calendarView === 'month') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else {
      const newWeekStart = new Date(currentWeekStart);
      newWeekStart.setDate(currentWeekStart.getDate() + 7);
      setCurrentWeekStart(newWeekStart);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());

    const day = today.getDay();
    const diff = today.getDate() - day;
    const weekStart = new Date(today);
    weekStart.setDate(diff);
    setCurrentWeekStart(weekStart);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">{getHeaderTitle()}</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowViewSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button onClick={() => {
            setSelectedDate(new Date());
            setShowCreateDialog(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {filteredEvents.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => {
                  setSelectedEvent(event);
                  setSearchQuery('');
                }}
              >
                <div className="font-semibold">{event.title}</div>
                <div className="text-sm text-gray-600">
                  {new Date(event.start_date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      {calendarView === 'year' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
        </div>
      )}

      {calendarView === 'month' && renderSingleMonth(currentMonth, currentYear)}

      {calendarView === 'week' && renderWeekView()}

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateEventDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          selectedDate={selectedDate}
          onEventCreated={fetchEvents}
        />
      )}

      {selectedEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={(open) => !open && setSelectedEvent(null)}
          onEventUpdated={fetchEvents}
          onEventDeleted={fetchEvents}
        />
      )}

      {showDayEventsDialog && (
        <DayEventsDialog
          open={showDayEventsDialog}
          onOpenChange={setShowDayEventsDialog}
          date={selectedDate}
          events={dayEvents}
          onEventClick={(event) => {
            setShowDayEventsDialog(false);
            setSelectedEvent(event);
          }}
          onAddEvent={() => {
            setShowDayEventsDialog(false);
            setShowCreateDialog(true);
          }}
          onEventsUpdated={fetchEvents}
        />
      )}

      <CalendarViewSettings
        open={showViewSettings}
        onOpenChange={setShowViewSettings}
        currentView={calendarView}
        onViewChange={setCalendarView}
      />
    </div>
  );
}
