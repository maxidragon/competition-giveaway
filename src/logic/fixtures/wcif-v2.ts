import type { Attempt, Person, Round, RoundResult, WCIF } from "../types";

// Invented WCIF 2.2 data: a 3x3x3 dual round (333-r1 + 333-r2) feeding a
// final, and a best-of-5 3x3x3 Blindfolded round.

function person(registrantId: number, name: string, wcaId: string | null): Person {
  return {
    name,
    wcaId,
    registrantId,
    countryIso2: "XA",
    registration: { status: "accepted", eventIds: ["333", "333bf"], guests: 0 },
    avatar: null,
  };
}

function result(personId: number, best: number, average: number): RoundResult {
  const attempts: Attempt[] = [best, best, best, best, best].map((value) => ({
    value,
    reconstruction: null,
  }));
  return { personId, ranking: null, attempts, best, average };
}

function round(
  id: string,
  format: Round["format"],
  linkedRounds: string[] | null,
  results: RoundResult[],
): Round {
  return { id, format, linkedRounds, results };
}

export const wcifV2: WCIF = {
  formatVersion: "2.2",
  id: "ExampleOpen2026",
  name: "Example Open 2026",
  shortName: "Example Open 2026",
  persons: [
    person(1, "Alex Example", "2020EXAM01"),
    person(2, "Sam Sample", "2021SAMP01"),
    person(3, "Robin Placeholder", null),
    person(4, "Jamie Fixture", "2019FIXT01"),
  ],
  events: [
    {
      id: "333",
      rounds: [
        // Alex and Sam compete in both legs, Robin only in the first, Jamie only in the second.
        round("333-r1", "a", ["333-r1", "333-r2"], [
          result(1, 1500, 1800),
          result(2, 2500, 3000),
          result(3, -1, -1),
        ]),
        round("333-r2", "a", ["333-r1", "333-r2"], [
          result(1, 1400, 1600),
          result(2, 2000, 2200),
          result(4, 2600, 2900),
        ]),
        round("333-r3", "a", null, [result(1, 1300, 1500)]),
      ],
    },
    {
      id: "333bf",
      rounds: [
        round("333bf-r1", "5", null, [
          result(1, 6000, 0),
          result(4, -1, 0),
        ]),
      ],
    },
  ],
};
