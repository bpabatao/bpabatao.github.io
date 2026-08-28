import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPeriod, monthLabel, plainText, shortMonthYear, splitLead } from "../src/lib/format.ts";

test("monthLabel formats YYYY-MM and passes YYYY through", () => {
  assert.equal(monthLabel("2023-06"), "Jun 2023");
  assert.equal(monthLabel("2019"), "2019");
  assert.throws(() => monthLabel("2023-13"), /bad period value/);
  assert.throws(() => monthLabel("June 2023"), /bad period value/);
});

test("formatPeriod renders Present for a null end", () => {
  assert.equal(formatPeriod({ start: "2023-06", end: null }), "Jun 2023 - Present");
  assert.equal(formatPeriod({ start: "2022-09", end: "2023-02" }), "Sep 2022 - Feb 2023");
  assert.equal(formatPeriod({ start: "2019", end: "2020" }), "2019 - 2020");
});

test("splitLead extracts a **lead** marker", () => {
  assert.deepEqual(splitLead("**Sole author of X:** the rest"), { lead: "Sole author of X:", rest: "the rest" });
  assert.deepEqual(splitLead("No lead here"), { lead: null, rest: "No lead here" });
  assert.equal(plainText("**Lead** rest"), "Lead rest");
  assert.equal(plainText("plain"), "plain");
});

test("shortMonthYear gives the Contact label form", () => {
  assert.equal(shortMonthYear("2026-08-28"), "aug 2026");
});
