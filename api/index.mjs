// Polyfills for pdf-parse/pdfjs-dist on Node.js environment
global.DOMMatrix = class DOMMatrix {
  constructor() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
};
global.ImageData = class ImageData {
  constructor() { return {}; }
};
global.Path2D = class Path2D {
  constructor() { return {}; }
};

import app from "../src/app.js";
export default app;
