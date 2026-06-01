import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DrawWheel from '../components/DrawWheel';
import WinnersList from '../components/WinnersList';
import SettingsModal from '../components/SettingsModal';
import { getWCIF, EVENT_NAMES, parseRoundLabel } from '../logic/wca';
import { getToken } from '../logic/auth';
import {
  getWinners,
  addWinner,
  removeWinner,
  saveWinners,
  getSettings,
  saveSettings,
} from '../logic/storage';
import type { FilterMode, GiveawaySettings, Person, WCIF, Winner } from '../logic/types';

export default function Giveaway() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [wcif, setWcif] = useState<WCIF | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [resultThreshold, setResultThreshold] = useState('');

  const [winners, setWinners] = useState<Winner[]>([]);
  const [settings, setSettings] = useState<GiveawaySettings>({
    autoAddWinnerToExclusions: true,
    giveawayLabel: '',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [drawTrigger, setDrawTrigger] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/', { replace: true }); return; }
    if (!id) return;

    setWinners(getWinners(id));
    setSettings(getSettings(id));

    getWCIF(id, token)
      .then((data) => {
        setWcif(data);
        if (data.events.length > 0) setSelectedEventId(data.events[0].id);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const winnerIds = useMemo(() => new Set(winners.map((w) => w.registrantId)), [winners]);

  const acceptedPersons = useMemo(
    () => (wcif?.persons ?? []).filter((p) => p.registration?.status === 'accepted'),
    [wcif]
  );

  const selectedEvent = useMemo(
    () => wcif?.events.find((e) => e.id === selectedEventId) ?? null,
    [wcif, selectedEventId]
  );

  const filteredCandidates = useMemo(() => {
    let pool = acceptedPersons;

    if (filterMode === 'newcomer') {
      pool = pool.filter((p) => !p.wcaId);
    } else if (filterMode === 'event' && selectedEventId) {
      pool = pool.filter((p) => p.registration?.eventIds.includes(selectedEventId));
    } else if (filterMode === 'round' && selectedEvent) {
      const round = selectedEvent.rounds[selectedRoundIndex];
      if (round && round.results.length > 0) {
        const isAvgBased = round.format === 'a' || round.format === 'm';
        const thresholdCs = resultThreshold.trim() !== ''
          ? Math.round(parseFloat(resultThreshold) * 100)
          : null;
        const eligibleIds = new Set(
          round.results
            .filter((r) => {
              if (thresholdCs === null) return true;
              if (isAvgBased) {
                // include if: no valid average (competed but DNFed) OR average meets threshold
                return r.average <= 0 || r.average >= thresholdCs;
              }
              return r.best > 0 && r.best <= thresholdCs;
            })
            .map((r) => r.personId)
        );
        pool = pool.filter((p) => eligibleIds.has(p.registrantId));
      } else {
        pool = [];
      }
    }

    return pool.filter((p) => !winnerIds.has(p.registrantId));
  }, [acceptedPersons, filterMode, selectedEventId, selectedEvent, selectedRoundIndex, resultThreshold, winnerIds]);

  function handleDraw() {
    if (filteredCandidates.length === 0 || isDrawing) return;
    setIsDrawing(true);
    setDrawTrigger((t) => t + 1);
  }

  const handleDrawComplete = useCallback(
    (winner: Person) => {
      setIsDrawing(false);
      if (!id || !settings.autoAddWinnerToExclusions) return;
      const entry: Winner = {
        registrantId: winner.registrantId,
        name: winner.name,
        addedAt: new Date().toISOString(),
        giveawayLabel: settings.giveawayLabel || undefined,
      };
      setWinners(addWinner(id, entry));
    },
    [id, settings]
  );

  function handleAddWinner(person: Person) {
    if (!id) return;
    setWinners(
      addWinner(id, {
        registrantId: person.registrantId,
        name: person.name,
        addedAt: new Date().toISOString(),
      })
    );
  }

  function handleRemoveWinner(registrantId: number) {
    if (!id) return;
    setWinners(removeWinner(id, registrantId));
  }

  function handleClearAll() {
    if (!id) return;
    saveWinners(id, []);
    setWinners([]);
  }

  function handleSettingsChange(s: GiveawaySettings) {
    if (!id) return;
    setSettings(s);
    saveSettings(id, s);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center gap-2 text-slate-500">
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading competition data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 p-4">
        <div className="px-4 py-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm max-w-sm text-center">
          {error}
        </div>
        <button
          onClick={() => navigate('/competitions')}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Back to competitions
        </button>
      </div>
    );
  }

  const roundOptions = selectedEvent?.rounds ?? [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/competitions')}
              className="shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back
            </button>
            <span className="text-slate-600">|</span>
            <h1 className="text-sm text-slate-400 truncate">{wcif?.name ?? id}</h1>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>
        </div>
      </header>

      {/* Giveaway title — big, inline-editable */}
      <div className="border-b border-slate-800 bg-slate-900 py-6 px-4 text-center">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={settings.giveawayLabel}
            onChange={(e) => handleSettingsChange({ ...settings, giveawayLabel: e.target.value })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false); }}
            placeholder="Giveaway title..."
            className="text-4xl md:text-5xl font-black text-center bg-transparent border-b-2 border-blue-500 outline-none w-full max-w-3xl text-slate-100 placeholder-slate-600 pb-1"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="group"
          >
            {settings.giveawayLabel ? (
              <span className="text-4xl md:text-5xl font-black text-slate-100 group-hover:text-white transition-colors">
                {settings.giveawayLabel}
              </span>
            ) : (
              <span className="text-xl text-slate-700 group-hover:text-slate-500 transition-colors">
                Click to set giveaway title
              </span>
            )}
          </button>
        )}
      </div>

      {/* Main content: filter sidebar + wheel */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Filter sidebar */}
        <aside className="w-full lg:w-60 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800 p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Pool Filter
            </h3>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio" name="filter" value="all"
                checked={filterMode === 'all'}
                onChange={() => setFilterMode('all')}
                className="accent-blue-500"
              />
              <span className="text-sm text-slate-200">All accepted</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio" name="filter" value="newcomer"
                checked={filterMode === 'newcomer'}
                onChange={() => setFilterMode('newcomer')}
                className="accent-blue-500"
              />
              <span className="text-sm text-slate-200">Newcomers only</span>
            </label>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio" name="filter" value="event"
                  checked={filterMode === 'event'}
                  onChange={() => setFilterMode('event')}
                  className="accent-blue-500"
                />
                <span className="text-sm text-slate-200">Registered for event</span>
              </label>
              {filterMode === 'event' && (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="ml-6 px-2 py-1.5 text-sm rounded-lg bg-slate-700 border border-slate-600 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {(wcif?.events ?? []).map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {EVENT_NAMES[ev.id] ?? ev.id}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio" name="filter" value="round"
                  checked={filterMode === 'round'}
                  onChange={() => setFilterMode('round')}
                  className="accent-blue-500"
                />
                <span className="text-sm text-slate-200">Competed in round</span>
              </label>
              {filterMode === 'round' && (
                <div className="ml-6 flex flex-col gap-2">
                  <select
                    value={selectedEventId}
                    onChange={(e) => { setSelectedEventId(e.target.value); setSelectedRoundIndex(0); }}
                    className="px-2 py-1.5 text-sm rounded-lg bg-slate-700 border border-slate-600 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {(wcif?.events ?? []).map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {EVENT_NAMES[ev.id] ?? ev.id}
                      </option>
                    ))}
                  </select>
                  {roundOptions.length > 0 && (
                    <select
                      value={selectedRoundIndex}
                      onChange={(e) => setSelectedRoundIndex(Number(e.target.value))}
                      className="px-2 py-1.5 text-sm rounded-lg bg-slate-700 border border-slate-600 text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      {roundOptions.map((r, i) => (
                        <option key={r.id} value={i}>
                          {parseRoundLabel(r.id)}
                          {r.results.length > 0 ? ` (${r.results.length})` : ' (no results)'}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">
                      {(() => {
                        const fmt = selectedEvent?.rounds[selectedRoundIndex]?.format ?? '';
                        return (fmt === 'a' || fmt === 'm') ? 'Average ≥' : 'Best single ≤';
                      })()} (seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={resultThreshold}
                      onChange={(e) => setResultThreshold(e.target.value)}
                      placeholder="e.g. 25.00"
                      className="px-2 py-1.5 text-sm rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <div className="text-sm text-slate-400">
                Pool:{' '}
                <span className={`font-semibold ${filteredCandidates.length === 0 ? 'text-red-400' : 'text-slate-100'}`}>
                  {filteredCandidates.length}
                </span>
                <span className="text-slate-600 text-xs ml-1">
                  / {acceptedPersons.length} accepted
                </span>
              </div>
              {winners.length > 0 && (
                <div className="text-xs text-slate-600 mt-0.5">{winners.length} excluded</div>
              )}
            </div>
          </div>
        </aside>

        {/* Draw area */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <DrawWheel
            candidates={filteredCandidates}
            drawTrigger={drawTrigger}
            onComplete={handleDrawComplete}
          />

          <button
            onClick={handleDraw}
            disabled={filteredCandidates.length === 0 || isDrawing}
            className={[
              'px-12 py-4 rounded-2xl text-lg font-bold uppercase tracking-widest transition-all',
              filteredCandidates.length === 0 || isDrawing
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-lg shadow-blue-900/40',
            ].join(' ')}
          >
            {isDrawing ? 'Spinning…' : 'Spin'}
          </button>

          {filteredCandidates.length === 0 && !isDrawing && (
            <p className="text-sm text-slate-500 text-center max-w-xs">
              {filterMode === 'round'
                ? 'No results found for this round yet.'
                : 'No eligible participants in the current pool.'}
            </p>
          )}
        </main>
      </div>

      {/* Exclusions bar — full width, no scroll */}
      <div className="border-t border-slate-800 bg-slate-900/60 px-5 py-5">
        <WinnersList
          winners={winners}
          allPersons={acceptedPersons}
          onAdd={handleAddWinner}
          onRemove={handleRemoveWinner}
          onClearAll={handleClearAll}
        />
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
