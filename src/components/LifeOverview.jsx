import React from 'react';
import { Activity } from 'lucide-react';

export default function LifeOverview() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
        <Activity size={48} className="text-violet-400" />
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          نظرة عامة
        </h2>
        <p className="text-white/40 max-w-md">
          ملخص شامل لنشاطك اليومي، أهدافك، والإنجازات التي حققتها.
        </p>
      </div>
    </div>
  );
}
