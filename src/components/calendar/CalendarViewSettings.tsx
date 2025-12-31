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
export type QuickViewPosition = 'top' | 'bottom' | 'left' | 'right' | 'off';

interface CalendarViewSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  quickViewPosition: QuickViewPosition;
  onQuickViewPositionChange: (position: QuickViewPosition) => void;
}

export function CalendarViewSettings({
  open,
  onOpenChange,
  currentView,
  onViewChange,
  quickViewPosition,
  onQuickViewPositionChange,
}: CalendarViewSettingsProps) {
  const [selectedView, setSelectedView] = useState<CalendarView>(currentView);
  const [selectedQuickView, setSelectedQuickView] = useState<QuickViewPosition>(quickViewPosition);

  const handleSave = () => {
    onViewChange(selectedView);
    onQuickViewPositionChange(selectedQuickView);
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

  const quickViewOptions = [
    { value: 'top' as QuickViewPosition, label: 'Top', description: 'Above the calendar' },
    { value: 'bottom' as QuickViewPosition, label: 'Bottom', description: 'Below the calendar' },
    { value: 'left' as QuickViewPosition, label: 'Left', description: 'Left side panel' },
    { value: 'right' as QuickViewPosition, label: 'Right', description: 'Right side panel' },
    { value: 'off' as QuickViewPosition, label: 'Off', description: 'Hide quick view' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calendar Settings</DialogTitle>
          <DialogDescription>
            Customize your calendar view and quick view panel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Calendar View Options */}
          <div>
            <h3 className="font-semibold mb-3">Calendar View</h3>
            <div className="space-y-2">
              {viewOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
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
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="font-semibold cursor-pointer text-sm">
                            {option.label}
                          </Label>
                          {selectedView === option.value && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick View Position Options */}
          <div>
            <h3 className="font-semibold mb-3">Quick View Position</h3>
            <div className="space-y-2">
              {quickViewOptions.map((option) => (
                <div
                  key={option.value}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedQuickView === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedQuickView(option.value)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold cursor-pointer text-sm">
                        {option.label}
                      </Label>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {option.description}
                      </p>
                    </div>
                    {selectedQuickView === option.value && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
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
