/// <reference types="vite/client" />

declare module "*.yaml" {
  const value: Record<string, any>;
  export default value;
}

interface ImportMetaEnv {
  readonly SIMPLE_PHP_BACKEND_URL?: string;
  readonly DATASET_ERRATA_URL?: string;
}