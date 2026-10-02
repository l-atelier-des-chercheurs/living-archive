import default_styles from "@/components/publications/edition/default_styles.css?raw";
import slash_styles from "@/components/publications/edition/slash_styles.css?raw";

// stylesheets shipped with the app, in the order they are offered.
// the key is what gets stored in the "style" query / opened_style_file_meta
export const builtin_styles = [
  { key: "default", title_key: "default_styles", css: default_styles },
  { key: "slash", title_key: "slash_styles", css: slash_styles },
];

export const builtinStyleCss = (key) =>
  builtin_styles.find((s) => s.key === key)?.css;

export const isBuiltinStyle = (key) =>
  builtin_styles.some((s) => s.key === key);
