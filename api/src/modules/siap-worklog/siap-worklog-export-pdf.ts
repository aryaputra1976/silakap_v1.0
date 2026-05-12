type PdfObject = {
  id: number;
  body: string;
};

type PdfLine = {
  text: string;
  bold?: boolean;
  gap?: number;
};

export type WorklogExportPdfInput = {
  title: string;
  subtitle: string;
  lines: PdfLine[];
};

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN_LEFT = 32;
const MARGIN_TOP = 34;
const MARGIN_BOTTOM = 30;
const FONT_SIZE = 8;
const TITLE_FONT_SIZE = 13;
const LINE_HEIGHT = 10;
const MAX_CHARS = 142;

export function buildWorklogExportPdf(input: WorklogExportPdfInput): Buffer {
  const normalizedLines: PdfLine[] = [
    { text: input.title, bold: true, gap: 0 },
    { text: input.subtitle, bold: false, gap: 4 },
    { text: '', gap: 8 },
    ...input.lines,
  ];

  const pages = paginateLines(normalizedLines);

  return serializePdf(pages);
}

function paginateLines(lines: PdfLine[]) {
  const pages: PdfLine[][] = [];
  let current: PdfLine[] = [];
  let used = 0;
  const maxHeight = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

  for (const line of lines) {
    const wrapped = wrapLine(normalizePdfText(line.text), MAX_CHARS);

    for (const [index, text] of wrapped.entries()) {
      const entry: PdfLine = {
        text,
        bold: line.bold,
        gap: index === 0 ? line.gap ?? 0 : 0,
      };

      const height = LINE_HEIGHT + (entry.gap ?? 0);

      if (used + height > maxHeight && current.length > 0) {
        pages.push(current);
        current = [];
        used = 0;
      }

      current.push(entry);
      used += height;
    }
  }

  if (current.length > 0) {
    pages.push(current);
  }

  return pages.length > 0 ? pages : [[{ text: 'Tidak ada data.' }]];
}

function wrapLine(value: string, maxChars: number) {
  if (!value) {
    return [''];
  }

  if (value.length <= maxChars) {
    return [value];
  }

  const words = value.split(' ');
  const result: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars) {
      if (current) {
        result.push(current);
      }

      current = word;
      continue;
    }

    current = next;
  }

  if (current) {
    result.push(current);
  }

  return result.length > 0 ? result : [''];
}

function serializePdf(pages: PdfLine[][]) {
  const objects: PdfObject[] = [];
  const catalogId = 1;
  const pagesId = 2;
  const fontId = 3;
  const boldFontId = 4;
  const pageObjectIds: number[] = [];

  objects.push({
    id: catalogId,
    body: '<< /Type /Catalog /Pages 2 0 R >>',
  });

  objects.push({
    id: pagesId,
    body: '__PAGES__',
  });

  objects.push({
    id: fontId,
    body: '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',
  });

  objects.push({
    id: boldFontId,
    body: '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>',
  });

  pages.forEach((pageLines, pageIndex) => {
    const pageId = 5 + pageIndex * 2;
    const contentId = pageId + 1;
    pageObjectIds.push(pageId);

    const stream = buildPageStream(pageLines, pageIndex + 1, pages.length);

    objects.push({
      id: pageId,
      body: [
        '<<',
        '/Type /Page',
        '/Parent 2 0 R',
        `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]`,
        '/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>',
        `/Contents ${contentId} 0 R`,
        '>>',
      ].join('\n'),
    });

    objects.push({
      id: contentId,
      body: [
        `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>`,
        'stream',
        stream,
        'endstream',
      ].join('\n'),
    });
  });

  const pagesObject = objects.find((object) => object.id === pagesId);

  if (!pagesObject) {
    throw new Error('PDF pages object not found');
  }

  pagesObject.body = `<< /Type /Pages /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(' ')}] /Count ${pageObjectIds.length} >>`;

  return buildPdfBuffer(objects, catalogId);
}

function buildPageStream(lines: PdfLine[], page: number, totalPages: number) {
  const commands: string[] = [];
  let y = PAGE_HEIGHT - MARGIN_TOP;

  for (const line of lines) {
    y -= line.gap ?? 0;

    const isTitle = line.bold && line.text.length < 80;
    const font = line.bold ? 'F2' : 'F1';
    const size = isTitle ? TITLE_FONT_SIZE : FONT_SIZE;

    commands.push('BT');
    commands.push(`/${font} ${size} Tf`);
    commands.push(`${MARGIN_LEFT} ${y} Td`);
    commands.push(`(${escapePdfString(line.text)}) Tj`);
    commands.push('ET');

    y -= isTitle ? TITLE_FONT_SIZE + 3 : LINE_HEIGHT;
  }

  commands.push('BT');
  commands.push('/F1 7 Tf');
  commands.push(`${PAGE_WIDTH - 120} 18 Td`);
  commands.push(`(Halaman ${page}/${totalPages}) Tj`);
  commands.push('ET');

  return commands.join('\n');
}

function buildPdfBuffer(objects: PdfObject[], rootObjectId: number) {
  const sorted = [...objects].sort((a, b) => a.id - b.id);
  const maxId = Math.max(...sorted.map((object) => object.id));
  let output = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = new Map<number, number>();

  for (const object of sorted) {
    offsets.set(object.id, Buffer.byteLength(output, 'latin1'));
    output += `${object.id} 0 obj\n${object.body}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(output, 'latin1');
  output += `xref\n0 ${maxId + 1}\n`;
  output += '0000000000 65535 f \n';

  for (let id = 1; id <= maxId; id += 1) {
    const offset = offsets.get(id);

    output +=
      offset === undefined
        ? '0000000000 65535 f \n'
        : `${String(offset).padStart(10, '0')} 00000 n \n`;
  }

  output += [
    'trailer',
    `<< /Size ${maxId + 1} /Root ${rootObjectId} 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
    '',
  ].join('\n');

  return Buffer.from(output, 'latin1');
}

function normalizePdfText(value: string) {
  return value
    .replace(/\r/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/…/g, '...')
    .replace(/\t/g, '    ')
    .replace(/[^\x09\x0A\x0D\x20-\x7EÀ-ÿ]/g, '');
}

function escapePdfString(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}