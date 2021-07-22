export { default as createNonRecoverableError } from './create-non-recoverable-error';
export { default as getSourceGroups } from './get-source-groups';
export { default as removeSourcesFromGroups } from './remove-source-from-groups';
export { default as resolveCanAccessSource } from './resolve-can-access-source';
export { default as parseJSON } from './parse-json';

export * from './constants';

export const getSourceId = src => src?.getID?.() ?? src;
export const isSameSource = (a, b) => getSourceId(a) === getSourceId(b);
