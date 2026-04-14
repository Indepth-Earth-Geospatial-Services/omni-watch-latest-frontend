// Global type declarations for non-TypeScript file imports

// CSS files — side-effect imports like `import './globals.css'` are valid, they export nothing
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
