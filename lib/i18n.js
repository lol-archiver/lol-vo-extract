import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { C } from '@nuogz/pangu';
import initI18N from '@nuogz/i18n';



export const { TT } = await initI18N(resolve(dirname(fileURLToPath(import.meta.url)), '..'));

export const T = TT(C.log.locale);
