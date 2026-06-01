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
  avatar?: {
    thumbUrl: string;
    url: string;
  };
}

export interface RoundResult {
  personId: number;
  ranking: number | null;
  attempts: unknown[];
  best: number;
  average: number;
}

export interface Round {
  id: string;
  format: string;
  results: RoundResult[];
}

export interface WCAEvent {
  id: string;
  rounds: Round[];
}

export interface WCIF {
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
