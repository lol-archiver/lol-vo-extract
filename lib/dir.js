import { C } from '@nuogz/pangu';
import { emptyDirSync, ensureDirSync } from 'fs-extra/esm';

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';



export const dirLib = dirname(fileURLToPath(import.meta.url));
export const dirApp = resolve(dirLib, '..');

export const dirData = resolve(dirApp, 'data');
export const dirConfig = resolve(dirApp, 'config');

export const dirLog = C.path.dirLog ?? resolve(dirApp, 'log');
export const dirCache = C.path.dirCache ?? resolve(dirApp, '@cache');
export const dirDebug = C.path.dirDebug ?? resolve(dirApp, '@debug');
export const dirTextAudio = C.path.dirTextAudio ?? resolve(dirApp, '@audio-text');

export const dirFinal = C.path.dirExportVoices ?? resolve(dirApp, '@final');
export const dirText = C.path.dirExportDictaion ?? resolve(dirApp, '@text');


ensureDirSync(resolve(dirCache, 'manifest'));
ensureDirSync(resolve(dirCache, 'bundle'));
ensureDirSync(resolve(dirCache, 'chunk'));
ensureDirSync(resolve(dirCache, 'asset'));
ensureDirSync(resolve(dirCache, 'audio'));
emptyDirSync(resolve(dirCache, 'extract'));

ensureDirSync(dirFinal);
ensureDirSync(dirText);
ensureDirSync(dirDebug);
ensureDirSync(resolve(dirDebug, 'hex'));
ensureDirSync(dirTextAudio);
