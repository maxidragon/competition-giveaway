export interface WCAUser {
  id: number;
  name: string;
  wca_id: string;
  avatar: {
    thumb_url: string;
    url: string;
  };
}

export interface Competition {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  country_iso2: string;
  url: string;
}

export interface Person {
  name: string;
  wcaId: string | null;
  registrantId: number;
  countryIso2: string;
  registration: {
    status: 'accepted' | 'pending' | 'deleted';
    eventIds: string[];
    guests: number;
  } | null;
  avatar: {
    thumbUrl: string;
    url: string;
  } | null;
}

// Centiseconds for timed events; 0 = skipped, -1 = DNF, -2 = DNS.
export type ResultValue = number;

export interface Attempt {
  value: ResultValue;
  reconstruction: string | null;
}

export interface RoundResult {
  personId: number;
  ranking: number | null;
  attempts: Attempt[];
  best: ResultValue;
  average: ResultValue;
}

// '5' = best of 5 (WCIF 1.1), 'h' = head-to-head (WCIF 2.0).
export type RoundFormat = '1' | '2' | '3' | '5' | 'a' | 'm' | 'h';

export interface Round {
  id: string;
  format: RoundFormat;
  // Rounds forming one dual round (Regulation 9v), including this one; null otherwise.
  linkedRounds: string[] | null;
  results: RoundResult[];
}

export interface WCAEvent {
  id: string;
  rounds: Round[];
}

export interface WCIF {
  formatVersion: string;
  id: string;
  name: string;
  shortName: string;
  persons: Person[];
  events: WCAEvent[];
}

export interface Winner {
  registrantId: number;
  name: string;
  addedAt: string;
  giveawayLabel?: string;
}

export interface GiveawaySettings {
  autoAddWinnerToExclusions: boolean;
  giveawayLabel: string;
}

export type FilterMode = 'all' | 'newcomer' | 'event' | 'round';
