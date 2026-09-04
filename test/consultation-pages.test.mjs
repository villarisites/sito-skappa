import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("honeymoonPage_hasNoPricesAndUsesConsultationCta", async () => {
  const page = await readFile(path.join(ROOT, "viaggi-di-nozze.html"), "utf8");
  assert.doesNotMatch(page, /\b\d+[.,]?\d*\s*€/);
  assert.match(page, />\s*Prenota una consulenza\s*</i);
  assert.match(page, /href="(?:contatti\.html|https:\/\/wa\.me\/)/);
  assert.doesNotMatch(page, /SkappaCatalog\.buildCard/);
});

test("cruisePage_isComingSoonAndSubmitsTypedFormspreeLead", async () => {
  const page = await readFile(path.join(ROOT, "crociere.html"), "utf8");
  assert.match(page, /in arrivo/i);
  assert.match(page, /action="https:\/\/formspree\.io\/f\/xlgpwjlj"/);
  assert.match(page, /method="POST"/i);
  assert.match(page, /name="tipo"\s+value="crociere"/);
  assert.match(page, /type="email"/);
});
