import { readJSONSync } from 'fs-extra/esm';

import { C } from '@nuogz/pangu';



export const en_us = readJSONSync('./data/base/en_us.json');
export const zh_cn = readJSONSync('./data/base/zh_cn.json');

export const all = { en_us, zh_cn };

export const D = all[C.lang] || en_us;
