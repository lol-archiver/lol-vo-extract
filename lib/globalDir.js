import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';


export const dirLib = dirname(fileURLToPath(import.meta.url));
export const dirApp = resolve(dirLib, '..');