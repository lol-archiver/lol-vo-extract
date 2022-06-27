import FSX from 'fs-extra';

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


FSX.ensureDirSync(resolve(dirCache, 'manifest'));
FSX.ensureDirSync(resolve(dirCache, 'bundle'));
FSX.ensureDirSync(resolve(dirCache, 'chunk'));
FSX.ensureDirSync(resolve(dirCache, 'asset'));
FSX.ensureDirSync(resolve(dirCache, 'extract'));
FSX.ensureDirSync(resolve(dirCache, 'audio'));
FSX.emptyDirSync(resolve(dirCache, 'extract'));

FSX.ensureDirSync(dirFinal);
FSX.ensureDirSync(resolve('@pool'));
