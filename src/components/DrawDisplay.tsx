import { useEffect, useRef, useState } from 'react';
import type { Person } from '../logic/types';

interface DrawDisplayProps {
  candidates: Person[];
  drawTrigger: number;
  onComplete: (winner: Person) => void;
}

export default function DrawDisplay({ candidates, drawTrigger, onComplete }: DrawDisplayProps) {
  const [displayPerson, setDisplayPerson] = useState<Person | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prevTrigger = useRef(0);

  useEffect(() => {
    if (drawTrigger === 0 || drawTrigger === prevTrigger.current || candidates.length === 0) return;
    prevTrigger.current = drawTrigger;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setIsDrawing(true);
    setIsDone(false);

    const winner = candidates[Math.floor(Math.random() * candidates.length)];

    const schedule: number[] = [];
    let total = 0;

    for (let i = 0; i < 30; i++) { total += 50; schedule.push(total); }
    for (const d of [100, 140, 185, 235, 295, 365, 445, 535, 635, 745]) {
      total += d;
      schedule.push(total);
    }

    schedule.forEach((delay) => {
      const t = setTimeout(() => {
        setDisplayPerson(candidates[Math.floor(Math.random() * candidates.length)]);
      }, delay);
      timeoutsRef.current.push(t);
    });

    const t = setTimeout(() => {
      setDisplayPerson(winner);
      setIsDrawing(false);
      setIsDone(true);
      onComplete(winner);
    }, total + 900);
    timeoutsRef.current.push(t);
  }, [drawTrigger, candidates, onComplete]);

  useEffect(() => {
    return () => { timeoutsRef.current.forEach(clearTimeout); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className={[
          'relative w-80 h-52 rounded-2xl border-2 flex flex-col items-center justify-center overflow-hidden transition-all duration-300',
          isDone
            ? 'border-green-400 bg-green-950/40 animate-winner-glow animate-winner-pop'
            : isDrawing
            ? 'border-blue-500 bg-blue-950/40'
            : 'border-slate-600 bg-slate-800/60',
        ].join(' ')}
      >
        {displayPerson ? (
          <div
            className={isDrawing ? 'animate-slot-flicker' : ''}
            style={{ textAlign: 'center' }}
          >
            <div
              className={`text-6xl font-black tracking-tight ${
                isDone ? 'text-green-400' : 'text-blue-300'
              }`}
            >
              #{displayPerson.registrantId}
            </div>
            <div className={`text-xl mt-2 font-medium ${isDone ? 'text-green-200' : 'text-slate-200'}`}>
              {displayPerson.name}
            </div>
            {isDone && (
              <div className="mt-3 text-green-400 text-sm font-semibold uppercase tracking-widest">
                Winner!
              </div>
            )}
          </div>
        ) : (
          <div className="text-slate-500 text-base">Press Draw to start</div>
        )}
      </div>
    </div>
  );
}
