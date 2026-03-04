import { useCallback } from 'react';

/**
 * Hook لتصدير البيانات كملف CSV
 */
export default function useExportCSV(enrichedData) {
  const exportCSV = useCallback(() => {
    let csv =
      'Week,Start Date,Sat,Sun,Mon,Tue,Wed,Thu,Fri,Friday Weight (kg),Body Fat (%)\n';

    enrichedData.forEach((row) => {
      const daysStr = row.enrichedDays
        .map((d) => {
          if (d.status === 'WORKOUT') return 'Workout';
          if (d.status === 'LOCKED_REST' || d.status === 'AUTO_REST') return 'Break';
          if (d.status === 'MISSED') return 'Missed';
          return '';
        })
        .join(',');

      csv += `${row.week},"${row.startDate}",${daysStr},${row.weight},${row.bodyFat}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Gym_Pro_Data_2026.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [enrichedData]);

  return exportCSV;
}
