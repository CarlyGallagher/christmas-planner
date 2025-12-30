'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { CalendarEvent } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface DayEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: () => void;
  onEventsUpdated: () => void;
}

export function DayEventsDialog({
  open,
  onOpenChange,
  date,
  events,
  onEventClick,
  onAddEvent,
  onEventsUpdated,
}: DayEventsDialogProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleDelete = async (event: CalendarEvent) => {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) {
      return;
    }

    setDeletingId(event.id);

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', event.id);

    if (error) {
      alert('Failed to delete event: ' + error.message);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    onEventsUpdated();
  };

  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formatDate(date)}</DialogTitle>
          <DialogDescription>
            {events.length === 0
              ? 'No events scheduled for this day'
              : `${events.length} event${events.length === 1 ? '' : 's'}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: event.color || '#3b82f6' }}
                      />
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                    </div>

                    <div className="text-sm text-gray-600 mb-1">
                      {formatTime(event.start_date)} - {formatTime(event.end_date)}
                    </div>

                    {event.description && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    {event.is_recurring && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <span className="inline-block w-4 h-4">🔁</span>
                        Recurring event
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(event)}
                    disabled={deletingId === event.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No events scheduled for this day.</p>
              <p className="text-sm mt-1">Click the button below to add one.</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={onAddEvent} className="flex-1">
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
