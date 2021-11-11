import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';


export const dirLib = dirname(fileURLToPath(import.meta.url));
export const dirApp = resolve(dirLib, '..');
export const dirConfig = resolve(dirApp, 'config');
export const dirLog = resolve(dirApp, 'log');
export const dirCache = resolve(dirApp, '_cache');