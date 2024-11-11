import { readJSONSync } from 'fs-extra/esm';

import { C } from '@nuogz/pangu';



/** @typedef {import('../bases.d.ts').Champions} Champions */

/** @type {Champions} */
export const en_us = readJSONSync('./data/base/en_us.json');
/** @type {Champions} */
export const zh_cn = readJSONSync('./data/base/zh_cn.json');

/** @type {Object<string,Champions>} */
export const champions$lang = { en_us, zh_cn };

export const D = champions$lang[C?.base?.lang] || en_us;
