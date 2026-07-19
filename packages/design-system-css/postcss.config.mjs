import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import customMedia from "postcss-custom-media";
import postcssImport from "postcss-import";
import nesting from "postcss-nesting";

export default ({ env = process.env.NODE_ENV }) => ({
  map: env !== "production",
  plugins: [
    postcssImport(),
    customMedia({ preserve: false }),
    nesting(),
    autoprefixer(),
    ...(env === "production" ? [cssnano({ preset: "default" })] : []),
  ],
});
