import { emptyDirSync, ensureDirSync } from './fs-extra.js';

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';



export const dirLib = dirname(fileURLToPath(import.meta.url));
export const dirApp = resolve(dirLib, '..');
export const dirData = resolve(dirApp, 'data');
export const dirConfig = resolve(dirApp, 'config');
export const dirLog = resolve(dirApp, 'log');

export const dirCache = resolve(dirApp, '@cache');
export const dirFinal = resolve(dirApp, '@final');
export const dirText = resolve(dirApp, '@text');


ensureDirSync(resolve(dirCache, 'manifest'));
ensureDirSync(resolve(dirCache, 'bundle'));
ensureDirSync(resolve(dirCache, 'chunk'));
ensureDirSync(resolve(dirCache, 'asset'));
ensureDirSync(resolve(dirCache, 'extract'));
ensureDirSync(resolve(dirCache, 'audio'));
emptyDirSync(resolve(dirCache, 'extract'));

ensureDirSync(dirFinal);
ensureDirSync(resolve('@pool'));
