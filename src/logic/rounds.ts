import type { ResultValue, Round, RoundFormat, RoundResult } from "./types";

// A round as the organiser sees it: either a single round, or the rounds that
// together form one dual round (Regulation 9v, WCIF `linkedRounds`).
export interface RoundGroup {
  id: string;
  label: string;
  format: RoundFormat;
  rounds: Round[];
}

export function parseRoundNumber(roundId: string): number {
  const parts = roundId.split("-");
  return Number(parts[parts.length - 1].replace("r", ""));
}

export function isAverageBased(format: RoundFormat): boolean {
  return format === "a" || format === "m";
}

export function groupRounds(rounds: Round[]): RoundGroup[] {
  const groups: RoundGroup[] = [];
  const grouped = new Set<string>();

  for (const round of rounds) {
    if (grouped.has(round.id)) continue;
    const linkedIds = round.linkedRounds ?? [];
    const members = rounds.filter(
      (r) => r.id === round.id || linkedIds.includes(r.id),
    );
    members.forEach((r) => grouped.add(r.id));

    const numbers = members.map((r) => parseRoundNumber(r.id));
    groups.push({
      id: members.map((r) => r.id).join("+"),
      label:
        members.length > 1
          ? `Round ${numbers.join(" & ")} (dual)`
          : `Round ${numbers[0]}`,
      format: round.format,
      rounds: members,
    });
  }

  return groups;
}

// Best valid value, or -1 when the person has none (only DNF/DNS/skipped).
function bestValue(values: ResultValue[]): ResultValue {
  const valid = values.filter((v) => v > 0);
  return valid.length > 0 ? Math.min(...valid) : -1;
}

function resultsByPerson(group: RoundGroup): Map<number, RoundResult[]> {
  const byPerson = new Map<number, RoundResult[]>();
  for (const result of group.rounds.flatMap((r) => r.results)) {
    byPerson.set(result.personId, [
      ...(byPerson.get(result.personId) ?? []),
      result,
    ]);
  }
  return byPerson;
}

export function countCompetitors(group: RoundGroup): number {
  return resultsByPerson(group).size;
}

// Linked rounds are ranked on each competitor's best result across all of
// them, so the threshold is applied to that best result too.
export function eligibleRegistrantIds(
  group: RoundGroup,
  thresholdCs: number | null,
): Set<number> {
  const eligible = new Set<number>();
  for (const [personId, results] of resultsByPerson(group)) {
    if (thresholdCs !== null) {
      if (isAverageBased(group.format)) {
        const average = bestValue(results.map((r) => r.average));
        // Keep people who competed but have no valid average.
        if (average > 0 && average < thresholdCs) continue;
      } else {
        const best = bestValue(results.map((r) => r.best));
        if (best <= 0 || best > thresholdCs) continue;
      }
    }
    eligible.add(personId);
  }
  return eligible;
}
