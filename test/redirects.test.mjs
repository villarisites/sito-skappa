import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("redirects_keepWipFirstAndPermanentlyMapLegacyPagesAndIds", async () => {
  const source = await readFile(path.join(ROOT, "netlify.toml"), "utf8");
  const wipCatchAll = source.indexOf('from = "/*"');
  const firstPermanent = source.indexOf('status = 301');
  assert.ok(wipCatchAll >= 0 && wipCatchAll < firstPermanent, "il catch-all WIP deve restare prima dei 301");

  for (const [from, to] of [
    ["/summer-tour.html", "/mare-sole.html"],
    ["/fughe-in-europa.html", "/europa.html"],
    ["/last-minute.html", "/offerte.html"]
  ]) {
    assert.match(source, new RegExp(`from = "${from.replace(".", "\\.")}"[\\s\\S]{0,80}to = "${to.replace(".", "\\.")}"[\\s\\S]{0,80}status = 301`));
  }

  const archiveTargets = new Map([
    ["gallipoli", "/mare-sole.html"], ["ibiza", "/mare-sole.html"],
    ["lloret-de-mar", "/mare-sole.html"], ["malta", "/mare-sole.html"],
    ["mykonos", "/mare-sole.html"], ["zante", "/mare-sole.html"],
    ["tirana", "/europa.html"], ["varsavia", "/europa.html"]
  ]);
  for (const [id, target] of archiveTargets) {
    const rule = new RegExp(`from = "/viaggio\\.html"[\\s\\S]{0,100}to = "${target.replace(".", "\\.")}"[\\s\\S]{0,100}status = 301[\\s\\S]{0,100}query = \\{ id = "${id}" \\}`);
    assert.match(source, rule, `${id}: redirect query permanente`);
  }
});
