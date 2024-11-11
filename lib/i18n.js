import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { TT, loadI18NResource } from '@nuogz/i18n';



loadI18NResource('@nuogz/lol-vo-extract', resolve(dirname(fileURLToPath(import.meta.url)), '..', 'locale'));


export const { T, TS } = TT('@nuogz/lol-vo-extract');
