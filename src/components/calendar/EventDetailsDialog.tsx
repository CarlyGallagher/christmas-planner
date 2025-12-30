'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit } from 'lucide-react';
import type { CalendarEvent } from '@/types';

interface EventDetailsDialogProps {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated: () => void;
  onEventDeleted: () => void;
}

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
];

const RECURRENCE_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Daily', value: 'FREQ=DAILY' },
  { label: 'Weekly', value: 'FREQ=WEEKLY' },
  { label: 'Monthly', value: 'FREQ=MONTHLY' },
  { label: 'Yearly', value: 'FREQ=YEARLY' },
];

export function EventDetailsDialog({
  event,
  open,
  onOpenChange,
  onEventUpdated,
  onEventDeleted,
}: EventDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [date, setDate] = useState(event.start_date.split('T')[0]);
  const [startTime, setStartTime] = useState(
    new Date(event.start_date).toTimeString().slice(0, 5)
  );
  const [endTime, setEndTime] = useState(
    new Date(event.end_date).toTimeString().slice(0, 5)
  );
  const [color, setColor] = useState(event.color || '#3b82f6');
  const [recurrence, setRecurrence] = useState(event.recurrence_rule || '');
  const [reminderMinutes, setReminderMinutes] = useState<number | ''>(
    event.reminder_minutes || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const startDate = new Date(`${date}T${startTime}`).toISOString();
    const endDate = new Date(`${date}T${endTime}`).toISOString();

    const { error: updateError } = await supabase
      .from('calendar_events')
      .update({
        title,
        description: description || null,
        start_date: startDate,
        end_date: endDate,
        is_recurring: !!recurrence,
        recurrence_rule: recurrence || null,
        reminder_minutes: reminderMinutes || null,
        color,
      })
      .eq('id', event.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setIsEditing(false);
    setLoading(false);
    onEventUpdated();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setLoading(true);

    const { error: deleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', event.id);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onEventDeleted();
    onOpenChange(false);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getRecurrenceLabel = (rule: string | undefined) => {
    if (!rule) return 'Does not repeat';
    const option = RECURRENCE_OPTIONS.find((opt) => opt.value === rule);
    return option ? option.label : 'Custom recurrence';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Event' : 'Event Details'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the event information'
              : formatDateTime(event.start_date)}
          </DialogDescription>
        </DialogHeader>

        {!isEditing ? (
          <div className="space-y-4">
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: event.color || '#3b82f6', color: 'white' }}
            >
              <h2 className="text-2xl font-bold">{event.title}</h2>
            </div>

            {event.description && (
              <div>
                <h3 className="font-semibold mb-1">Description</h3>
                <p className="text-gray-600">{event.description}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-1">Time</h3>
              <p className="text-gray-600">
                {formatDateTime(event.start_date)} -{' '}
                {new Date(event.end_date).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Recurrence</h3>
              <p className="text-gray-600">{getRecurrenceLabel(event.recurrence_rule)}</p>
            </div>

            {event.reminder_minutes && (
              <div>
                <h3 className="font-semibold mb-1">Reminder</h3>
                <p className="text-gray-600">{event.reminder_minutes} minutes before</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button onClick={handleDelete} variant="destructive" disabled={loading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Start Time *</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-endTime">End Time *</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      color === c.value ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setColor(c.value)}
                    disabled={loading}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-recurrence">Repeat</Label>
              <select
                id="edit-recurrence"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full border rounded-md p-2"
                disabled={loading}
              >
                {RECURRENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-reminder">Reminder (minutes before)</Label>
              <Input
                id="edit-reminder"
                type="number"
                min="0"
                value={reminderMinutes}
                onChange={(e) =>
                  setReminderMinutes(e.target.value ? parseInt(e.target.value) : '')
                }
                placeholder="e.g., 15, 30, 60"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
