const REQUIRED_COLUMNS = [
  "id", "nome", "categorie", "prezzo", "durata", "partenzaDa", "date", "hotel", "tagline"
];

export function parseCatalogCsv(source) {
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;
  const text = String(source).replace(/^\uFEFF/, "");

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ";") {
      record.push(field);
      field = "";
    } else if (character === "\n") {
      record.push(field.replace(/\r$/, ""));
      records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) {
    throw new Error("CSV non valido: campo tra virgolette non chiuso");
  }

  if (field.length > 0 || record.length > 0) {
    record.push(field.replace(/\r$/, ""));
    records.push(record);
  }

  const nonEmptyRecords = records.filter((values) => values.some((value) => value.trim() !== ""));
  const columns = nonEmptyRecords.shift() ?? [];
  const rows = nonEmptyRecords.map((values) => Object.fromEntries(
    columns.map((column, index) => [column, values[index] ?? ""])
  ));

  return { columns, rows };
}

export function validateCatalogRows(rows, { allowedCategories, expectedIds } = {}) {
  const errors = [];
  const seenIds = new Set();
  const allowed = allowedCategories ?? new Set();

  rows.forEach((row, index) => {
    const line = index + 2;
    const id = String(row.id ?? "").trim();
    const rawCategories = String(row.categorie ?? "").trim();
    const rawPrice = String(row.prezzo ?? "").trim();

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      errors.push(`riga ${line}: id non valido: ${id || "(vuoto)"}`);
    }
    if (seenIds.has(id)) {
      errors.push(`riga ${line}: id duplicato: ${id || "(vuoto)"}`);
    } else {
      seenIds.add(id);
    }

    if (!rawCategories) {
      errors.push(`riga ${line}: categorie mancanti`);
    } else {
      const categories = rawCategories.split("|").map((value) => value.trim()).filter(Boolean);
      for (const category of categories) {
        if (!allowed.has(category)) {
          errors.push(`riga ${line}: categoria sconosciuta: ${category}`);
        }
      }
    }

    if (!rawPrice) {
      errors.push(`riga ${line}: prezzo mancante`);
    } else if (!/^\d+(?:[.,]\d+)?$/.test(rawPrice) || Number(rawPrice.replace(",", ".")) <= 0) {
      errors.push(`riga ${line}: prezzo non numerico: ${rawPrice}`);
    }
  });

  if (expectedIds) {
    if (rows.length !== expectedIds.size) {
      errors.push(`catalogo: sono richieste ${expectedIds.size} mete, trovate ${rows.length}`);
    }
    for (const id of expectedIds) {
      if (!seenIds.has(id)) errors.push(`catalogo: meta mancante: ${id}`);
    }
    for (const id of seenIds) {
      if (id && !expectedIds.has(id)) errors.push(`catalogo: meta non prevista: ${id}`);
    }
  }

  return errors;
}

export function validateCatalogColumns(columns) {
  const errors = [];
  for (const column of REQUIRED_COLUMNS) {
    if (!columns.includes(column)) errors.push(`intestazione: colonna mancante: ${column}`);
  }
  for (const column of columns) {
    if (!REQUIRED_COLUMNS.includes(column)) errors.push(`intestazione: colonna sconosciuta: ${column}`);
  }
  return errors;
}

export function catalogRowsToScript(rows) {
  const destinations = rows.map((row) => ({
    id: row.id.trim(),
    nome: row.nome.trim(),
    categorie: row.categorie.split("|").map((value) => value.trim()).filter(Boolean),
    prezzo: Number(row.prezzo.replace(",", ".")),
    durata: row.durata.trim(),
    partenzaDa: row.partenzaDa.trim(),
    date: row.date.trim(),
    hotel: row.hotel.trim(),
    tagline: row.tagline.trim()
  }));

  return `window.DESTINATIONS = ${JSON.stringify(destinations, null, 2)};\n`;
}

export function mergeCatalogRows() {
  throw new Error("not implemented");
}
