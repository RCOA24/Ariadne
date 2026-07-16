/**
 * Allows TypeScript tooling to resolve global stylesheet side-effect imports.
 * Next.js handles the stylesheet at build time; this declaration supports
 * editors that have not yet loaded Next's generated type declarations.
 */
declare module "*.css";
