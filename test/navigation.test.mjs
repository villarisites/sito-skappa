import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATEGORY_PAGES = [
  "mercatini-natale.html", "europa.html", "mare-sole.html", "intercontinentali.html",
  "viaggi-di-nozze.html", "crociere.html"
];

test("navigation_buildsSixCategoriesFromTheSingleSourceForDesktopAndMobile", async () => {
  const partial = await readFile(path.join(ROOT, "partials", "nav.html"), "utf8");
  const builder = await readFile(path.join(ROOT, "scripts", "build-pages.mjs"), "utf8");
  assert.match(partial, /\{\{desktopCategories\}\}/);
  assert.match(partial, /\{\{mobileCategories\}\}/);
  assert.match(builder, /path\.join\(root,\s*['"]data['"],\s*['"]categorie\.js/);
  assert.match(builder, /SKAPPA_CATEGORIE/);

  const page = await readFile(path.join(ROOT, "europa.html"), "utf8");
  for (const categoryPage of CATEGORY_PAGES) {
    assert.equal(page.split(`href="${categoryPage}"`).length - 1, 2, `${categoryPage}: desktop e mobile`);
  }
  for (const [href, label] of [
    ["index.html", "Home"], ["offerte.html", "Offerte"], ["chi-siamo.html", "Chi siamo"],
    ["index.html#kit", "Contatti"]
  ]) {
    assert.match(page, new RegExp(`href="${href}"[^>]*>[^<]*${label}`));
  }
  assert.match(page, />Destinazioni</);
});
