import type { Winner, GiveawaySettings } from './types';

const WINNERS_PREFIX = 'giveaway-winners-';
const SETTINGS_PREFIX = 'giveaway-settings-';

export function getWinners(competitionId: string): Winner[] {
  const raw = localStorage.getItem(WINNERS_PREFIX + competitionId);
  return raw ? (JSON.parse(raw) as Winner[]) : [];
}

export function saveWinners(competitionId: string, winners: Winner[]): void {
  localStorage.setItem(WINNERS_PREFIX + competitionId, JSON.stringify(winners));
}

export function addWinner(competitionId: string, winner: Winner): Winner[] {
  const winners = getWinners(competitionId);
  if (winners.some((w) => w.registrantId === winner.registrantId)) return winners;
  const updated = [...winners, winner];
  saveWinners(competitionId, updated);
  return updated;
}

export function removeWinner(competitionId: string, registrantId: number): Winner[] {
  const updated = getWinners(competitionId).filter((w) => w.registrantId !== registrantId);
  saveWinners(competitionId, updated);
  return updated;
}

const DEFAULT_SETTINGS: GiveawaySettings = {
  autoAddWinnerToExclusions: true,
  giveawayLabel: '',
};

export function getSettings(competitionId: string): GiveawaySettings {
  const raw = localStorage.getItem(SETTINGS_PREFIX + competitionId);
  return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<GiveawaySettings>) } : DEFAULT_SETTINGS;
}

export function saveSettings(competitionId: string, settings: GiveawaySettings): void {
  localStorage.setItem(SETTINGS_PREFIX + competitionId, JSON.stringify(settings));
}
