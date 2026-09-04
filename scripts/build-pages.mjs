import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// La root del progetto e' la cartella superiore rispetto a scripts/
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const partialNames = ['nav', 'overlays', 'footer'];
const partials = Object.fromEntries(await Promise.all(partialNames.map(async (name) => {
  const content = await readFile(path.join(root, 'partials', `${name}.html`), 'utf8');
  return [name, content.trim()];
})));

function parseAttributes(source) {
  const attributes = {};
  for (const match of source.matchAll(/([\w-]+)="([^"]*)"/g)) attributes[match[1]] = match[2];
  return attributes;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function defaultActive(file) {
  return {
    'index.html': 'home',
    'fughe-in-europa.html': 'europa',
    'summer-tour.html': 'estate',
    'last-minute.html': 'last-minute'
  }[file] || '';
}

function cta(attributes, mobile) {
  const href = escapeAttribute(attributes['cta-href'] || 'index.html#offerte');
  const label = escapeHtml(attributes['cta-label'] || 'Scopri i viaggi');
  const id = !mobile && attributes['cta-id'] ? ` id="${escapeAttribute(attributes['cta-id'])}"` : '';
  const markerStyle = attributes[mobile ? 'cta-mobile-style' : 'cta-desktop-style'];
  const style = markerStyle || (mobile ? 'justify-content:center' : '');
  const styleAttribute = style ? ` style="${escapeAttribute(style)}"` : '';
  return `<a href="${href}" class="${mobile ? 'btn-gold mt-2' : 'btn-navy'}"${id}${styleAttribute}>${label}</a>`;
}

function renderNav(template, attributes, file) {
  const active = Object.prototype.hasOwnProperty.call(attributes, 'active')
    ? attributes.active
    : defaultActive(file);
  let rendered = template
    .replace('{{desktopCta}}', cta(attributes, false))
    .replace('{{mobileCta}}', cta(attributes, true));
  for (const key of ['home', 'europa', 'estate', 'last-minute']) {
    rendered = rendered
      .replace(`{{active:${key}}}`, active === key ? ' active' : '')
      .replace(`{{current:${key}}}`, active === key ? ' aria-current="page"' : '');
  }
  return rendered;
}

function indent(content, whitespace) {
  return content.split('\n').map((line, index) => index === 0 ? line : whitespace + line).join('\n');
}

const htmlFiles = (await readdir(root)).filter((file) => file.endsWith('.html')).sort();

for (const file of htmlFiles) {
  const fullPath = path.join(root, file);
  const original = await readFile(fullPath, 'utf8');
  let found = false;
  const updated = original.replace(
    /([ \t]*)<!--#partial (nav|overlays|footer)([^>]*)-->[\s\S]*?<!--#endpartial-->/g,
    (block, whitespace, name, rawAttributes) => {
      found = true;
      const attributes = parseAttributes(rawAttributes);
      const content = name === 'nav' ? renderNav(partials[name], attributes, file) : partials[name];
      return `${whitespace}<!--#partial ${name}${rawAttributes}-->\n${whitespace}${indent(content, whitespace)}\n${whitespace}<!--#endpartial-->`;
    }
  );

  if (!found) console.log(`${file}: saltato`);
  else if (updated === original) console.log(`${file}: invariato`);
  else {
    await writeFile(fullPath, updated, 'utf8');
    console.log(`${file}: aggiornato`);
  }
}
