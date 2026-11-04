// tsconfig limits `types` to vitest/jest-dom, so Vite's `?raw` import
// suffix needs its own ambient declaration (used by index.css.test.ts).
declare module "*?raw" {
  const content: string;
  export default content;
}
