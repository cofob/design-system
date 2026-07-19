import autoprefixer from "autoprefixer";
import customMedia from "postcss-custom-media";
import postcssImport from "postcss-import";
import nesting from "postcss-nesting";

export default {
  plugins: [postcssImport(), customMedia({ preserve: false }), nesting(), autoprefixer()],
};
