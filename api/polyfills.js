/**
 * Vercel Node.js Polyfills
 * These ensure that libraries expecting basic browser globals don't crash the server.
 */
global.DOMMatrix = class DOMMatrix {
  constructor() {
    this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
  }
};
global.ImageData = class ImageData {
  constructor() { return {}; }
};
global.Path2D = class Path2D {
  constructor() { return {}; }
};

console.log("✅ Polyfills loaded successfully.");
