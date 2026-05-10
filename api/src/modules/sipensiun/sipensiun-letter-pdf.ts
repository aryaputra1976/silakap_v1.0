export type PdfLetterInput = {
  title: string;
  body: string;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

const MARGIN_LEFT = 42;
const MARGIN_RIGHT = 42;
const MARGIN_TOP = 24;
const MARGIN_BOTTOM = 28;

const FONT_SIZE = 7.4;
const BOLD_FONT_SIZE = 7.4;
const LINE_HEIGHT = 9.4;

const CHAR_WIDTH_RATIO = 0.6;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const MAX_CHARS_PER_LINE = Math.floor(
  CONTENT_WIDTH / (FONT_SIZE * CHAR_WIDTH_RATIO),
);

const SIGNATURE_X = 330;
const SIGNATURE_WIDTH = PAGE_WIDTH - MARGIN_RIGHT - SIGNATURE_X;

type PdfObject = {
  id: number;
  body: string;
};

type PdfLine = {
  text: string;
  bold: boolean;
  x: number;
  yGapBefore: number;
  spacer: boolean;
  justify: boolean;
  maxWidth: number;
};

export function buildSipensiunLetterPdf(input: PdfLetterInput): Buffer {
  const parsedLines = parseLines(input.body);
  const pages = paginateLines(parsedLines);

  return serializePdf(pages);
}

function parseLines(body: string): PdfLine[] {
  const rawLines = body.split('\n').map((line) => normalizePdfText(line));
  const result: PdfLine[] = [];

  rawLines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      result.push({
        text: '',
        bold: false,
        x: MARGIN_LEFT,
        yGapBefore: 3,
        spacer: true,
        justify: false,
        maxWidth: CONTENT_WIDTH,
      });
      return;
    }

    const block = resolveLineBlock(trimmed, index);
    const sourceText = trimmed;

    wrapLine(sourceText, block.maxChars).forEach(
      (wrapped, wrappedIndex, wrappedLines) => {
        const isWrappedContinuation = wrappedIndex > 0;
        const isLastWrappedLine = wrappedIndex === wrappedLines.length - 1;
        const x = isWrappedContinuation
          ? block.x + block.wrapIndent
          : block.x;

        result.push({
          text: wrapped.trim(),
          bold: block.bold,
          x,
          yGapBefore: wrappedIndex === 0 ? block.yGapBefore : 0,
          spacer: false,
          justify:
            block.justify &&
            !isLastWrappedLine &&
            shouldJustifyText(wrapped),
          maxWidth: PAGE_WIDTH - MARGIN_RIGHT - x,
        });
      },
    );
  });

  return result;
}

function resolveLineBlock(
  trimmed: string,
  index: number,
): {
  x: number;
  bold: boolean;
  yGapBefore: number;
  maxChars: number;
  wrapIndent: number;
  justify: boolean;
} {
  if (index <= 2) {
    return {
      x: 310,
      bold: false,
      yGapBefore: 0,
      maxChars: 42,
      wrapIndent: 0,
      justify: false,
    };
  }

  if (
    trimmed === 'Kepada' ||
    trimmed.startsWith('Yth.') ||
    trimmed === 'Di -' ||
    trimmed === 'Jakarta' ||
    trimmed === 'Makassar'
  ) {
    return {
      x: centerX(trimmed, FONT_SIZE),
      bold: false,
      yGapBefore: trimmed === 'Kepada' ? 4 : 0,
      maxChars: 48,
      wrapIndent: 0,
      justify: false,
    };
  }

  if (
    trimmed.startsWith('1.') ||
    trimmed.startsWith('2.') ||
    trimmed.startsWith('3.') ||
    trimmed.startsWith('4.')
  ) {
    return {
      x: MARGIN_LEFT,
      bold: false,
      yGapBefore:
        trimmed.startsWith('2.') ||
        trimmed.startsWith('3.') ||
        trimmed.startsWith('4.')
          ? 4
          : 0,
      maxChars: MAX_CHARS_PER_LINE,
      wrapIndent: 16,
      justify: false,
    };
  }

  if (/^[a-z]\./i.test(trimmed)) {
    return {
      x: MARGIN_LEFT + 16,
      bold: false,
      yGapBefore: 0,
      maxChars: MAX_CHARS_PER_LINE - 5,
      wrapIndent: 18,
      justify: false,
    };
  }

  if (isNarrativeLine(trimmed)) {
    return {
      x: MARGIN_LEFT + 16,
      bold: false,
      yGapBefore: trimmed.startsWith('Dengan ini') ? 4 : 0,
      maxChars: MAX_CHARS_PER_LINE - 5,
      wrapIndent: 0,
      justify: true,
    };
  }

  if (trimmed.startsWith('Tolitoli,')) {
    return {
      x: SIGNATURE_X,
      bold: false,
      yGapBefore: 8,
      maxChars: Math.floor(SIGNATURE_WIDTH / (FONT_SIZE * CHAR_WIDTH_RATIO)),
      wrapIndent: 0,
      justify: false,
    };
  }

  if (
    trimmed === 'Hormat Saya,' ||
    trimmed.startsWith('---------------------------------') ||
    trimmed.startsWith('NIP.')
  ) {
    return {
      x: SIGNATURE_X,
      bold: false,
      yGapBefore: 0,
      maxChars: Math.floor(SIGNATURE_WIDTH / (FONT_SIZE * CHAR_WIDTH_RATIO)),
      wrapIndent: 0,
      justify: false,
    };
  }

  if (trimmed.startsWith('Nb :')) {
    return {
      x: MARGIN_LEFT,
      bold: false,
      yGapBefore: 2,
      maxChars: MAX_CHARS_PER_LINE,
      wrapIndent: 0,
      justify: false,
    };
  }

  return {
    x: MARGIN_LEFT,
    bold: false,
    yGapBefore: 0,
    maxChars: MAX_CHARS_PER_LINE,
    wrapIndent: 16,
    justify: false,
  };
}

function isNarrativeLine(trimmed: string): boolean {
  return (
    trimmed.startsWith('Dengan ini') ||
    trimmed.startsWith('Pegawai Negeri') ||
    trimmed.startsWith('Sipil ') ||
    trimmed.startsWith('tanggal ') ||
    trimmed.startsWith('dinyatakan ') ||
    trimmed.startsWith('dokter/') ||
    trimmed.startsWith('sebagai ') ||
    trimmed.startsWith('Kabupaten ')
  );
}

function shouldJustifyText(text: string): boolean {
  const words = text.trim().split(/\s+/);

  return words.length >= 5 && text.length >= 42 && !text.includes(':');
}

function paginateLines(lines: PdfLine[]): PdfLine[][] {
  const pages: PdfLine[][] = [];
  let currentPage: PdfLine[] = [];
  let usedHeight = 0;
  const maxHeight = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

  lines.forEach((line) => {
    const height = line.spacer ? 6 : LINE_HEIGHT + line.yGapBefore;

    if (usedHeight + height > maxHeight && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
      usedHeight = 0;
    }

    currentPage.push(line);
    usedHeight += height;
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0
    ? pages
    : [
        [
          {
            text: '',
            bold: false,
            x: MARGIN_LEFT,
            yGapBefore: 0,
            spacer: false,
            justify: false,
            maxWidth: CONTENT_WIDTH,
          },
        ],
      ];
}

function normalizePdfText(value: string): string {
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

function wrapLine(line: string, maxChars: number): string[] {
  if (line.length <= maxChars) {
    return [line];
  }

  const words = line.split(' ');
  const wrapped: string[] = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars) {
      if (current) {
        wrapped.push(current);
      }

      current = word;
      return;
    }

    current = next;
  });

  if (current) {
    wrapped.push(current);
  }

  return wrapped.length > 0 ? wrapped : [''];
}

function serializePdf(pages: PdfLine[][]): Buffer {
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
    body: '__PAGES_OBJECT_PLACEHOLDER__',
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

    const stream = buildPageStream(pageLines, pageIndex + 1);

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

  const kids = pageObjectIds.map((id) => `${id} 0 R`).join(' ');
  const pagesObject = objects.find((object) => object.id === pagesId);

  if (!pagesObject) {
    throw new Error('PDF pages object not found');
  }

  pagesObject.body = `<< /Type /Pages /Kids [${kids}] /Count ${pageObjectIds.length} >>`;

  return buildPdfBuffer(objects, catalogId);
}

function buildPageStream(lines: PdfLine[], pageNumber: number): string {
  const commands: string[] = [];
  let y = PAGE_HEIGHT - MARGIN_TOP;

  lines.forEach((line) => {
    if (line.spacer) {
      y -= 6;
      return;
    }

    y -= line.yGapBefore;

    const fontName = line.bold ? 'F2' : 'F1';
    const fontSize = line.bold ? BOLD_FONT_SIZE : FONT_SIZE;
    const wordSpacing = line.justify ? calculateWordSpacing(line, fontSize) : 0;

    commands.push('BT');
    commands.push(`/${fontName} ${fontSize} Tf`);

    if (wordSpacing > 0) {
      commands.push(`${formatNumber(wordSpacing)} Tw`);
    }

    commands.push(`${formatNumber(line.x)} ${formatNumber(y)} Td`);
    commands.push(`(${escapePdfString(line.text)}) Tj`);

    if (wordSpacing > 0) {
      commands.push('0 Tw');
    }

    commands.push('ET');

    y -= LINE_HEIGHT;
  });

  if (pageNumber > 1) {
    commands.push('BT');
    commands.push('/F1 7 Tf');
    commands.push(`${PAGE_WIDTH - MARGIN_RIGHT - 20} ${MARGIN_BOTTOM / 2} Td`);
    commands.push(`(${pageNumber}) Tj`);
    commands.push('ET');
  }

  return commands.join('\n');
}

function calculateWordSpacing(line: PdfLine, fontSize: number): number {
  const text = line.text.trim();
  const spaces = (text.match(/ /g) ?? []).length;

  if (spaces <= 0) {
    return 0;
  }

  const currentWidth = estimateTextWidth(text, fontSize);
  const extraWidth = line.maxWidth - currentWidth;

  if (extraWidth <= 0 || extraWidth > 70) {
    return 0;
  }

  return extraWidth / spaces;
}

function centerX(text: string, fontSize: number): number {
  const approximateWidth = estimateTextWidth(text, fontSize);

  return Math.max(MARGIN_LEFT, (PAGE_WIDTH - approximateWidth) / 2);
}

function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * CHAR_WIDTH_RATIO;
}

function formatNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function escapePdfString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildPdfBuffer(objects: PdfObject[], rootObjectId: number): Buffer {
  const sortedObjects = [...objects].sort((left, right) => left.id - right.id);
  const maxObjectId = Math.max(...sortedObjects.map((object) => object.id));

  let output = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = new Map<number, number>();

  sortedObjects.forEach((object) => {
    offsets.set(object.id, Buffer.byteLength(output, 'latin1'));
    output += `${object.id} 0 obj\n${object.body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(output, 'latin1');

  output += `xref\n0 ${maxObjectId + 1}\n`;
  output += '0000000000 65535 f \n';

  for (let id = 1; id <= maxObjectId; id += 1) {
    const offset = offsets.get(id);

    if (offset === undefined) {
      output += '0000000000 65535 f \n';
    } else {
      output += `${String(offset).padStart(10, '0')} 00000 n \n`;
    }
  }

  output += [
    'trailer',
    `<< /Size ${maxObjectId + 1} /Root ${rootObjectId} 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
    '',
  ].join('\n');

  return Buffer.from(output, 'latin1');
}