// esbuild bundles .md imports as strings (build.mjs `loader: { ".md": "text" }`).
declare module "*.md" {
  const text: string;
  export default text;
}
