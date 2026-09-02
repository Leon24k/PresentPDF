/**
 * Creates a dynamically calculated, 100% structurally valid multi-page PDF byte array
 * with exact byte offsets in the xref table for flawless PDF.js parsing.
 */
export function generateSamplePdfBuffer(): ArrayBuffer {
  const objects: string[] = [];

  // Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  // Pages container (4 slides)
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R 6 0 R] /Count 4 /MediaBox [0 0 960 540] >>\nendobj');

  // Pages
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> /Contents 9 0 R >>\nendobj');
  objects.push('4 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> /Contents 10 0 R >>\nendobj');
  objects.push('5 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> /Contents 11 0 R >>\nendobj');
  objects.push('6 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> /Contents 12 0 R >>\nendobj');

  // Fonts
  objects.push('7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');
  objects.push('8 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  // Stream contents for each slide
  const streams = [
    `0.05 0.08 0.12 rg 0 0 960 540 re f 0.39 0.40 0.95 rg 80 430 800 6 re f 1 1 1 rg BT /F1 40 Tf 80 460 Td (PresentPDF: Next-Gen PDF Presentation) Tj /F2 20 Tf 0 -80 Td 0.7 0.75 0.85 rg (Exported seamlessly from Canva, Gamma AI, or PowerPoint.) Tj /F2 16 Tf 0 -50 Td 0.5 0.6 0.75 rg (Features: 3D Cube, Keynote Zoom, Smooth Slide, 24h Auto-Purge.) Tj /F1 18 Tf 0 -120 Td 0.39 0.85 0.60 rg (Press Right Arrow or Click HUD to try 3D Cube transition!) Tj ET`,
    `0.08 0.05 0.14 rg 0 0 960 540 re f 0.93 0.27 0.27 rg 80 430 800 6 re f 1 1 1 rg BT /F1 38 Tf 80 460 Td (Slide 2: Interactive Presenter Toolkit) Tj /F2 20 Tf 0 -80 Td 0.8 0.85 0.9 rg (- Virtual Laser Pointer (L) with particle glow trailing) Tj /F2 20 Tf 0 -40 Td (- Pen & Highlighter Annotator (A / P) for live sketching) Tj /F2 20 Tf 0 -40 Td (- Blackout Screen (B) / Whiteout Screen (W)) Tj /F2 20 Tf 0 -40 Td (- Slide Grid Overview (G) to jump across all slides) Tj ET`,
    `0.04 0.10 0.12 rg 0 0 960 540 re f 0.10 0.75 0.60 rg 80 430 800 6 re f 1 1 1 rg BT /F1 38 Tf 80 460 Td (Slide 3: Ephemeral 24-Hour Lifecycle) Tj /F2 20 Tf 0 -80 Td 0.8 0.85 0.9 rg (- Zero disk overflow: all files auto-deleted after 24 hours.) Tj /F2 20 Tf 0 -40 Td (- 100% Free Tier: Netlify, Vercel & IndexedDB architecture.) Tj /F2 20 Tf 0 -40 Td (- Private, lightning-fast 60 FPS hardware-accelerated rendering.) Tj ET`,
    `0.07 0.08 0.15 rg 0 0 960 540 re f 0.95 0.60 0.20 rg 80 430 800 6 re f 1 1 1 rg BT /F1 40 Tf 80 460 Td (Slide 4: Ready to Present!) Tj /F2 22 Tf 0 -80 Td 0.85 0.9 0.95 rg (Drag and drop your own PDF from Canva or AI anytime.) Tj /F1 18 Tf 0 -80 Td 0.39 0.40 0.95 rg (Enjoy your presentation with PresentPDF!) Tj ET`,
  ];

  for (let i = 0; i < streams.length; i++) {
    const s = streams[i];
    objects.push(`${9 + i} 0 obj\n<< /Length ${s.length} >>\nstream\n${s}\nendstream\nendobj`);
  }

  let pdfContent = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdfContent.length);
    pdfContent += objects[i] + '\n';
  }

  const xrefOffset = pdfContent.length;
  pdfContent += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    const offStr = offsets[i].toString().padStart(10, '0');
    pdfContent += `${offStr} 00000 n \n`;
  }

  pdfContent += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const buffer = new ArrayBuffer(pdfContent.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < pdfContent.length; i++) {
    view[i] = pdfContent.charCodeAt(i);
  }
  return buffer;
}
