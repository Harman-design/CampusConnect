import React from 'react';

export function SkeletonMetric() {
  return (
    <div className="bg-[#111827] border border-slate-850 p-5 rounded-2xl space-y-3 shimmer-load">
      <div className="h-3 w-16 bg-slate-800 rounded opacity-60" />
      <div className="h-8 w-24 bg-slate-800 rounded" />
      <div className="h-3 w-32 bg-slate-800 rounded opacity-40" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-5 bg-[#1E293B] border border-slate-800 rounded-2xl space-y-4 shimmer-load">
      <div className="flex justify-between items-center">
        <div className="h-4 w-16 bg-slate-800 rounded" />
        <div className="h-4 w-20 bg-slate-800 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-3/4 bg-slate-800 rounded" />
        <div className="h-3 w-1/2 bg-slate-800 rounded opacity-60" />
      </div>
      <div className="pt-3 border-t border-slate-800/50 flex gap-2">
        <div className="h-8 flex-1 bg-slate-800 rounded" />
        <div className="h-8 flex-1 bg-slate-800 rounded" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="w-full bg-[#111827] border border-slate-850 rounded-2xl p-5 space-y-4 shimmer-load">
      <div className="flex justify-between border-b border-slate-800 pb-3">
        <div className="h-4 w-1/4 bg-slate-800 rounded" />
        <div className="h-4 w-1/6 bg-slate-800 rounded" />
        <div className="h-4 w-1/6 bg-slate-800 rounded" />
      </div>
      {[...Array(4)].map((_, idx) => (
        <div key={idx} className="flex justify-between py-2.5 border-b border-slate-800/40">
          <div className="h-3 w-1/3 bg-slate-800 rounded" />
          <div className="h-3 w-12 bg-slate-800 rounded" />
          <div className="h-3 w-16 bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-[#111827] border border-slate-850 p-6 rounded-2xl h-64 flex flex-col justify-between shimmer-load">
      <div className="h-4 w-1/3 bg-slate-800 rounded" />
      <div className="flex-1 flex items-end justify-between gap-2 px-4 py-6">
        <div className="w-6 h-1/4 bg-slate-800 rounded-t" />
        <div className="w-6 h-3/4 bg-slate-800 rounded-t" />
        <div className="w-6 h-1/2 bg-slate-800 rounded-t" />
        <div className="w-6 h-5/6 bg-slate-800 rounded-t" />
        <div className="w-6 h-2/3 bg-slate-800 rounded-t" />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600">
        <div className="h-3 w-6 bg-slate-800 rounded" />
        <div className="h-3 w-6 bg-slate-800 rounded" />
        <div className="h-3 w-6 bg-slate-800 rounded" />
      </div>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-[#111827] border border-slate-850 rounded-2xl shimmer-load">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-slate-800 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-3 w-36 bg-slate-800 rounded" />
              <div className="h-2.5 w-24 bg-slate-800 rounded opacity-60" />
            </div>
          </div>
          <div className="h-5 w-16 bg-slate-800 rounded-full" />
        </div>
      ))}
    </div>
  );
}
