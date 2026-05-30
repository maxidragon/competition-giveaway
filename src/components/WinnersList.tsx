import { useState } from 'react';
import type { Person, Winner } from '../logic/types';

interface WinnersListProps {
  winners: Winner[];
  allPersons: Person[];
  onAdd: (person: Person) => void;
  onRemove: (registrantId: number) => void;
  onClearAll: () => void;
}

export default function WinnersList({ winners, allPersons, onAdd, onRemove, onClearAll }: WinnersListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const winnerIds = new Set(winners.map((w) => w.registrantId));
  const acceptedPersons = allPersons.filter((p) => p.registration?.status === 'accepted');

  const searchResults = search.trim()
    ? acceptedPersons.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          String(p.registrantId).includes(search.trim())
      )
    : [];

  function handleAdd(person: Person) {
    onAdd(person);
    setSearch('');
    setShowAdd(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 flex-wrap">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Excluded ({winners.length})
        </h3>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add manually'}
        </button>
        {winners.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-red-500 hover:text-red-400 transition-colors ml-auto"
          >
            Clear all
          </button>
        )}
      </div>

      {showAdd && (
        <div className="relative max-w-xs">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-72 max-h-48 overflow-y-auto rounded-lg border border-slate-600 bg-slate-800 shadow-xl">
              {searchResults.slice(0, 15).map((p) => (
                <button
                  key={p.registrantId}
                  onClick={() => handleAdd(p)}
                  disabled={winnerIds.has(p.registrantId)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="text-slate-200">{p.name}</span>
                  <span className="text-slate-500 text-xs">
                    {winnerIds.has(p.registrantId) ? 'already excluded' : `#${p.registrantId}`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {winners.length === 0 ? (
          <span className="text-slate-600 text-sm">No exclusions yet</span>
        ) : (
          winners.map((w) => (
            <div
              key={w.registrantId}
              className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-slate-700 border border-slate-600 text-sm"
            >
              <span className="font-medium text-slate-200">{w.name}</span>
              <span className="text-slate-500 text-xs">#{w.registrantId}</span>
              {w.giveawayLabel && (
                <span className="text-slate-600 text-xs">· {w.giveawayLabel}</span>
              )}
              <button
                onClick={() => onRemove(w.registrantId)}
                className="w-5 h-5 flex items-center justify-center rounded-full text-slate-500 hover:text-red-400 hover:bg-red-900/30 transition-colors leading-none"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
