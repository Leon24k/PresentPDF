/**
 * Creates a minimal multi-page PDF byte array for immediate testing and demonstration
 */
export function generateSamplePdfBuffer(): ArrayBuffer {
  // A clean 4-page PDF document format
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R 6 0 R] /Count 4 /MediaBox [0 0 960 540] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> /Contents 9 0 R >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> /Contents 10 0 R >>
endobj
5 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> /Contents 11 0 R >>
endobj
6 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> /Contents 12 0 R >>
endobj
7 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
8 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
9 0 obj
<< /Length 320 >>
stream
0.05 0.08 0.12 rg
0 0 960 540 re
f
0.39 0.40 0.95 rg
80 430 800 6 re
f
1 1 1 rg
BT
/F1 44 Tf
80 460 Td
(HostPDF: Next-Gen PDF Presentation) Tj
/F2 20 Tf
0 -80 Td
0.7 0.75 0.85 rg
(Exported seamlessly from Canva, Gamma AI, or PowerPoint.) Tj
/F2 16 Tf
0 -50 Td
0.5 0.6 0.75 rg
(Features: 3D Cube, Keynote Zoom, Smooth Slide, 24h Auto-Purge.) Tj
/F1 18 Tf
0 -120 Td
0.39 0.85 0.60 rg
(Press Right Arrow (->) or Click HUD to try 3D Cube transition!) Tj
ET
endstream
endobj
10 0 obj
<< /Length 310 >>
stream
0.08 0.05 0.14 rg
0 0 960 540 re
f
0.93 0.27 0.27 rg
80 430 800 6 re
f
1 1 1 rg
BT
/F1 40 Tf
80 460 Td
(Slide 2: Interactive Presenter Toolkit) Tj
/F2 20 Tf
0 -80 Td
0.8 0.85 0.9 rg
(- Virtual Laser Pointer (L) with particle glow trailing) Tj
0 -40 Td
(- Pen & Highlighter Annotator (A / P) for live sketching) Tj
0 -40 Td
(- Blackout Screen (B) / Whiteout Screen (W)) Tj
0 -40 Td
(- Slide Grid Overview (G) to jump across all slides) Tj
ET
endstream
endobj
11 0 obj
<< /Length 300 >>
stream
0.04 0.10 0.12 rg
0 0 960 540 re
f
0.10 0.75 0.60 rg
80 430 800 6 re
f
1 1 1 rg
BT
/F1 40 Tf
80 460 Td
(Slide 3: Ephemeral 24-Hour Lifecycle) Tj
/F2 20 Tf
0 -80 Td
0.8 0.85 0.9 rg
(- Zero disk overflow: all files auto-deleted after 24 hours.) Tj
0 -40 Td
(- 100% Free Tier: Netlify, Vercel & IndexedDB architecture.) Tj
0 -40 Td
(- Private, lightning-fast 60 FPS hardware-accelerated rendering.) Tj
ET
endstream
endobj
12 0 obj
<< /Length 280 >>
stream
0.07 0.08 0.15 rg
0 0 960 540 re
f
0.95 0.60 0.20 rg
80 430 800 6 re
f
1 1 1 rg
BT
/F1 42 Tf
80 460 Td
(Slide 4: Ready to Present!) Tj
/F2 22 Tf
0 -80 Td
0.85 0.9 0.95 rg
(Drag and drop your own PDF from Canva or AI anytime.) Tj
/F1 18 Tf
0 -80 Td
0.39 0.40 0.95 rg
(Enjoy your presentation with HostPDF!) Tj
ET
endstream
endobj
xref
0 13
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000155 00000 n 
0000000252 00000 n 
0000000349 00000 n 
0000000446 00000 n 
0000000543 00000 n 
0000000618 00000 n 
0000000687 00000 n 
0000001058 00000 n 
0000001419 00000 n 
0000001770 00000 n 
trailer
<< /Size 13 /Root 1 0 R >>
startxref
2101
%%EOF`;

  const buffer = new ArrayBuffer(pdfString.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < pdfString.length; i++) {
    view[i] = pdfString.charCodeAt(i);
  }
  return buffer;
}
