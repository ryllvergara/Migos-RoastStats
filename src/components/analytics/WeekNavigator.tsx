import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface WeekNavigatorProps {
  start: Date;
  end: Date;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function WeekNavigator({ start, end, weekOffset, onPrevWeek, onNextWeek }: WeekNavigatorProps) {
  return (
    <div className="flex items-center bg-white border-2 border-gray-100 rounded-2xl p-1 shadow-sm">
      <button onClick={onPrevWeek} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
        <ChevronLeft className="h-5 w-5 text-gray-400" />
      </button>
      <div className="px-4 text-center min-w-[200px]">
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Selected Week</p>
        <p className="text-sm font-bold">
          {format(start, 'MMM dd, yyyy')} - {format(end, 'MMM dd, yyyy')}
        </p>
      </div>
      <button
        onClick={onNextWeek}
        disabled={weekOffset === 0}
        className="p-2 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-20"
      >
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </button>
    </div>
  );
}