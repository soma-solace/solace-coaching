/* Generates a readable, selectable PDF from the exact profile text. */
(function (root) {
  async function createProfilePdf(profileText) {
    if (!profileText || typeof profileText !== 'string') {
      throw new Error('Generate your profile before downloading it.');
    }
    if (!root.PDFLib) {
      throw new Error('The PDF generator is unavailable. Please refresh and try again.');
    }

    const { PDFDocument, StandardFonts, rgb } = root.PDFLib;
    const pdf = await PDFDocument.create();
    pdf.setTitle('Solace Coaching Profile');
    pdf.setSubject('Vedic Coaching Profile');
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const size = [612, 792]; // US Letter
    const margin = 44;
    const bottom = 53;
    const lineHeight = 12;
    const bodySize = 8.5;
    const navy = rgb(0.10, 0.20, 0.29);
    const ink = rgb(0.14, 0.20, 0.26);
    let page;
    let y;

    function newPage() {
      page = pdf.addPage(size);
      y = size[1] - margin;
    }

    function wrap(line, font, fontSize) {
      const width = size[0] - margin * 2;
      const words = line.trim().split(/\s+/);
      const rows = [];
      let row = '';
      for (const word of words) {
        const candidate = row ? row + ' ' + word : word;
        if (row && font.widthOfTextAtSize(candidate, fontSize) > width) {
          rows.push(row);
          row = word;
        } else {
          row = candidate;
        }
      }
      if (row) rows.push(row);
      return rows;
    }

    newPage();
    for (const [index, line] of profileText.replace(/\r\n?/g, '\n').split('\n').entries()) {
      if (!line.trim()) {
        y -= 5;
        continue;
      }
      const isTitle = index === 0;
      const isHeading = line.startsWith('--- ') && line.endsWith(' ---');
      const font = isTitle || isHeading ? bold : regular;
      const fontSize = isTitle ? 13 : isHeading ? 9 : bodySize;
      const content = isHeading ? line.slice(4, -4)
        : line.trim() === '(Paste this entire block into the Solace app when asked)'
          ? '(Upload this PDF in the Solace app when asked)'
          : line.trim();
      const rows = wrap(content, font, fontSize);
      const before = isHeading ? 10 : isTitle ? 0 : 0;
      if (y - before - rows.length * lineHeight < bottom) newPage();
      y -= before;
      for (const row of rows) {
        if (y < bottom) newPage();
        page.drawText(row, { x: margin, y, size: fontSize, font,
          color: isTitle || isHeading ? navy : ink });
        y -= lineHeight;
      }
      if (isTitle) y -= 6;
    }

    const pages = pdf.getPages();
    pages.forEach((p, i) => {
      p.drawLine({ start: { x: margin, y: 36 }, end: { x: size[0] - margin, y: 36 },
        thickness: 0.5, color: rgb(0.82, 0.87, 0.90) });
      p.drawText('Solace Coaching Profile', { x: margin, y: 23, size: 7.5,
        font: regular, color: ink });
      p.drawText(String(i + 1), { x: size[0] - margin - 12, y: 23, size: 7.5,
        font: regular, color: ink });
    });
    return pdf.save();
  }

  root.createProfilePdf = createProfilePdf;
})(typeof window !== 'undefined' ? window : globalThis);
