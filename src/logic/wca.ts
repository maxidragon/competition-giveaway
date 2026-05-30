import type { WCAUser, Competition, WCIF } from "./types";

const WCA_ORIGIN = "https://www.worldcubeassociation.org";
export const WCA_CLIENT_ID = "-Tlc3J-Nnekh6-KCgOlq2HTU5SkUTVcXHjhfoyVEEUQ";
const API_BASE = `${WCA_ORIGIN}/api/v0`;

export function getAuthUrl(): string {
  const redirectUri = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    client_id: WCA_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: "public manage_competitions",
  });
  return `${WCA_ORIGIN}/oauth/authorize?${params}`;
}

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`WCA API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function getMe(token: string): Promise<WCAUser> {
  const data = await apiFetch<{ me: WCAUser }>("/me", token);
  return data.me;
}

export async function getMyCompetitions(token: string): Promise<Competition[]> {
  return apiFetch<Competition[]>(
    "/competitions?managed_by_me=true&sort=-start_date&per_page=100",
    token,
  );
}

export async function getWCIF(
  competitionId: string,
  token: string,
): Promise<WCIF> {
  return apiFetch<WCIF>(`/competitions/${competitionId}/wcif`, token);
}

export const EVENT_NAMES: Record<string, string> = {
  "222": "2x2x2",
  "333": "3x3x3",
  "333bf": "3x3x3 Blindfolded",
  "333fm": "3x3x3 Fewest Moves",
  "333mbf": "3x3x3 Multi-Blind",
  "333oh": "3x3x3 One-Handed",
  "444": "4x4x4",
  "444bf": "4x4x4 Blindfolded",
  "555": "5x5x5",
  "555bf": "5x5x5 Blindfolded",
  "666": "6x6x6",
  "777": "7x7x7",
  clock: "Clock",
  minx: "Megaminx",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
};

export function parseRoundLabel(roundId: string): string {
  const parts = roundId.split("-");
  const roundNum = parts[parts.length - 1].replace("r", "");
  return `Round ${roundNum}`;
}
