import { CheckCircle2, Circle } from 'lucide-react';

/**
 * خلية يوم واحد في الجدول — تعرض الحالة المناسبة
 */
export default function DayCell({ dayObj, isGoalMet, onToggle }) {
  const { status } = dayObj;
  const isLocked = status === 'LOCKED_REST';

  return (
    <td className="p-2 text-center">
      <button
        onClick={onToggle}
        disabled={isLocked}
        className={`p-2 rounded-full focus:outline-none transition-all ${
          isLocked
            ? 'cursor-not-allowed opacity-90'
            : 'hover:bg-slate-200 active:scale-90'
        }`}
        title={status.replace('_', ' ')}
      >
        {status === 'WORKOUT' && (
          <CheckCircle2
            className="text-emerald-500 w-7 h-7 drop-shadow-sm"
            fill={isGoalMet ? '#d1fae5' : '#ecfdf5'}
          />
        )}

        {status === 'LOCKED_REST' && (
          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[14px] font-black border border-amber-200 shadow-sm animate-pop">
            B
          </div>
        )}

        {status === 'AUTO_REST' && (
          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[14px] font-bold shadow-sm hover:bg-slate-300 hover:text-slate-700">
            B
          </div>
        )}

        {status === 'MISSED' && (
          <div className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-[12px] font-bold border border-red-200 shadow-sm">
            X
          </div>
        )}

        {status === 'PENDING' && (
          <Circle className="text-slate-200 w-7 h-7 hover:text-slate-400" />
        )}
      </button>
    </td>
  );
}
