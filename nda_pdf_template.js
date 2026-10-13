// Builds a signed-copy PDF of the TSMP NDA — same clause text as nda.html,
// filled with the actual submission (name, signature image, Discord
// identity, timestamp). DMed to the signer right after /nda/submit via the
// polling loop in index.js. Pure pdf-lib, no headless browser dependency.
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const CLAUSES = [
  ['1.', 'What this covers.', 'Everything you receive through the mentorship — strategies, models, recordings, written materials, chat content, and anything shared in calls or Discord — is confidential. This includes information shared before or after you sign this, and regardless of how it was shared.'],
  ['2.', 'What you can do with it.', 'Use it to learn and trade for yourself. That\'s it.'],
  ['3.', 'What you can\'t do.', 'Share, repost, screenshot, record, or forward any of it to anyone outside the Program. Sell it, teach it, or build any product, service, or content from it. Use it in any way that competes with or undercuts TSMP.'],
  ['4.', 'Telling others who help you.', 'If you need to show material to someone else (an accountant, a business partner, etc.) for a legitimate reason connected to your own use, you can — but only if you first make clear to them it\'s confidential, and they agree to the same restrictions you\'re under here. You\'re responsible if they break this.'],
  ['5.', 'No refunds.', 'Payment for the Program is final. No refunds are issued for any reason, including if your access is revoked for breaking this agreement.'],
  ['6.', 'If you break this.', 'TSMP can revoke your access immediately, with no refund, and can seek a court order (injunction) plus damages — because once this kind of material leaks, no amount of money fixes it. You\'re also responsible for TSMP\'s legal costs if they have to enforce this agreement against you.'],
  ['7.', 'If you lose it or it gets out by accident.', 'If any confidential material is lost, stolen, or leaked — even unintentionally — you must tell TSMP immediately and do everything reasonable to help contain it.'],
  ['8.', 'If a court or government body makes you disclose it.', 'If you\'re legally compelled to disclose something covered by this agreement, tell TSMP first (in writing, before you comply) so they have the chance to respond.'],
  ['9.', 'Give it back if asked.', 'If TSMP asks, or if you leave the Program, you must return or destroy any confidential materials you still have and confirm you\'ve done so.'],
  ['10.', 'This keeps applying after you leave.', 'Your confidentiality obligation doesn\'t end when your membership does. It\'s permanent.'],
];

function wrapText(text, font, size, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function buildNdaPdf({ fullName, discordUsername, discordId, signatureDataUrl, agreedAt }) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612, pageHeight = 792; // US Letter
  const margin = 56;
  const contentWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function ensureSpace(neededHeight) {
    if (y - neededHeight < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  function drawLine(text, { size = 11, bold = false, color = rgb(0.11, 0.1, 0.09), gap = 14, centered = false } = {}) {
    ensureSpace(gap);
    const f = bold ? boldFont : font;
    const width = f.widthOfTextAtSize(text, size);
    const x = centered ? (pageWidth - width) / 2 : margin;
    page.drawText(text, { x, y, size, font: f, color });
    y -= gap;
  }

  const ink = rgb(0.11, 0.1, 0.09);
  const dim = rgb(0.33, 0.31, 0.29);

  // Letterhead
  drawLine('SMART MONEY PARADIGM', { size: 10, bold: true, color: dim, centered: true, gap: 20 });
  drawLine('NON-DISCLOSURE AGREEMENT', { size: 18, bold: true, centered: true, gap: 16 });
  drawLine('Confidentiality & Non-Use of Program Materials', { size: 11, color: dim, centered: true, gap: 20 });
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1.5, color: ink });
  y -= 24;

  const signedDate = new Date(agreedAt).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
  drawLine(`Document: TSMP-NDA-CONDENSED-V1`, { size: 9, color: dim, gap: 24 });

  drawLine('This agreement is between Smart Money Paradigm ("TSMP"), and the undersigned', { size: 11, centered: true, gap: 14 });
  drawLine('member of the Program ("you").', { size: 11, centered: true, gap: 26 });

  for (const [num, title, body] of CLAUSES) {
    const titleLine = `${num} ${title}`;
    ensureSpace(16);
    drawLine(titleLine, { size: 11, bold: true, gap: 15 });
    const lines = wrapText(body, font, 10.5, contentWidth);
    for (const line of lines) drawLine(line, { size: 10.5, gap: 13 });
    y -= 6;
  }

  y -= 6;
  drawLine('This agreement is governed by the laws of the State of California, United States.', { size: 10, color: dim, centered: true, gap: 24 });

  ensureSpace(160);
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1.5, color: ink });
  y -= 20;
  drawLine('SIGNATURE', { size: 11, bold: true, gap: 22 });

  drawLine(`Signing as (Discord): ${discordUsername} (${discordId})`, { size: 10.5, gap: 20 });
  drawLine(`Full legal name: ${fullName}`, { size: 10.5, gap: 24 });

  if (signatureDataUrl && signatureDataUrl.startsWith('data:image/png;base64,')) {
    try {
      const base64 = signatureDataUrl.split(',')[1];
      const sigBytes = Buffer.from(base64, 'base64');
      const sigImage = await doc.embedPng(sigBytes);
      const sigDims = sigImage.scaleToFit(200, 70);
      ensureSpace(sigDims.height + 10);
      page.drawImage(sigImage, { x: margin, y: y - sigDims.height, width: sigDims.width, height: sigDims.height });
      y -= sigDims.height + 14;
    } catch {
      drawLine('(signature image could not be embedded)', { size: 9, color: dim, gap: 18 });
    }
  } else {
    drawLine('No drawn signature on file', { size: 10, color: dim, gap: 18 });
  }

  drawLine(`Agreement accepted — recorded ${signedDate}`, { size: 10, bold: true, color: rgb(0.16, 0.43, 0.25), gap: 16 });

  return doc.save();
}

module.exports = { buildNdaPdf };
