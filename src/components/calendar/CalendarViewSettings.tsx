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
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, LayoutGrid, Rows, Columns } from 'lucide-react';

export type CalendarView = 'year' | 'month' | 'week';

interface CalendarViewSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

export function CalendarViewSettings({
  open,
  onOpenChange,
  currentView,
  onViewChange,
}: CalendarViewSettingsProps) {
  const [selectedView, setSelectedView] = useState<CalendarView>(currentView);

  const handleSave = () => {
    onViewChange(selectedView);
    onOpenChange(false);
  };

  const viewOptions = [
    {
      value: 'year' as CalendarView,
      label: 'Year View',
      description: 'See all 12 months at once',
      icon: LayoutGrid,
    },
    {
      value: 'month' as CalendarView,
      label: 'Month View',
      description: 'Focus on a single month',
      icon: CalendarIcon,
    },
    {
      value: 'week' as CalendarView,
      label: 'Week View',
      description: 'See one week in detail',
      icon: Rows,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Calendar View</DialogTitle>
          <DialogDescription>
            Choose how you want to view your calendar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {viewOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div
                key={option.value}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedView === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedView(option.value)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      selectedView === option.value
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-semibold cursor-pointer">
                        {option.label}
                      </Label>
                      {selectedView === option.value && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} className="flex-1">
            Apply
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
