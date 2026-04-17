// This file fixes typescript errors for parcel-bundled files that
// typescript does not know about. It does so by creating
// ambient modules (modules that do not really exist):
// https://parceljs.org/features/dependency-resolution/#typescript

// fix SCSS stylesheet modules
declare module "*.module.scss" {
  const value: Record<string, string>;
  export default value;
}

// fix PNG images
declare module "*.png" {
  const value: string;
  export default value;
}

// fix SVG images
declare module "*.svg" {
  const value: string;
  export default value;
}

// fix JSON files
declare module "*.json" {
  const value: Record<string, any>;
  export default value;
}

// fix YAML files
declare module "*.yaml" {
  const value: Record<string, any>;
  export default value;
}

// fix onnxruntime-web WebGL bundle imports
// no idea why this is needed, probably some parcel+web worker quirk.
// without this the webGL module is not resolved and I could not find
// any documentation on why it happens. An AI generated this workaround
// and it works. Do not ask me how or why.
// see: https://github.com/microsoft/onnxruntime/issues/26611
declare module "onnxruntime-web/dist/ort.webgl.min.mjs" {
  const ort: typeof import("onnxruntime-web");
  export default ort;
  export * from "onnxruntime-web";
}
