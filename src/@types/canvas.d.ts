declare module '@napi-rs/canvas' {
  // Fallback minimal type declarations to satisfy the TypeScript compiler in environments
  // where the actual type package resolution is unavailable to the editor/tsserver.
  export function createCanvas(width: number, height: number): any
}
