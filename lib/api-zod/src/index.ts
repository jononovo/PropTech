export * from "./generated/api";
export * from "./generated/types";
// Both generated barrels emit these names — explicit re-exports resolve TS2308.
// GetRunPageImageParams is consumed as a type; UploadDocumentParams and
// AddVariantBody are consumed as zod values by the api-server, so the api
// barrel's runtime schemas win for those.
export type { GetRunPageImageParams } from "./generated/types";
export { UploadDocumentParams, AddVariantBody } from "./generated/api";
export * from './generated/api';
export * from './generated/types';
