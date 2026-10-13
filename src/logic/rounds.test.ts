/// <reference types="node" />
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { wcifV2 } from "./fixtures/wcif-v2.ts";
import {
  countCompetitors,
  eligibleRegistrantIds,
  groupRounds,
  isAverageBased,
} from "./rounds.ts";

const [cube, blind] = wcifV2.events;

describe("groupRounds", () => {
  it("merges linked rounds into one dual round", () => {
    const groups = groupRounds(cube.rounds);

    assert.deepEqual(
      groups.map((g) => [g.id, g.label]),
      [
        ["333-r1+333-r2", "Round 1 & 2 (dual)"],
        ["333-r3", "Round 3"],
      ],
    );
  });

  it("keeps unlinked rounds and their format", () => {
    const [group] = groupRounds(blind.rounds);

    assert.equal(group.label, "Round 1");
    assert.equal(group.format, "5");
  });
});

describe("countCompetitors", () => {
  it("counts each competitor of a dual round once", () => {
    const [dual] = groupRounds(cube.rounds);

    assert.equal(countCompetitors(dual), 4);
  });
});

describe("eligibleRegistrantIds", () => {
  it("includes people who competed in either leg of a dual round", () => {
    const [dual] = groupRounds(cube.rounds);

    assert.deepEqual([...eligibleRegistrantIds(dual, null)].sort((a, b) => a - b), [1, 2, 3, 4]);
  });

  it("applies an average threshold to the best average across linked rounds", () => {
    const [dual] = groupRounds(cube.rounds);

    // Sam's best average is 22.00, Jamie's 29.00; Robin has no valid average.
    assert.deepEqual([...eligibleRegistrantIds(dual, 2500)].sort((a, b) => a - b), [3, 4]);
  });

  it("treats best-of-5 rounds as single-based", () => {
    const [group] = groupRounds(blind.rounds);

    assert.equal(isAverageBased(group.format), false);
    assert.deepEqual([...eligibleRegistrantIds(group, 9000)], [1]);
  });
});
