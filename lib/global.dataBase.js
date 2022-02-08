import FSX from 'fs-extra';

import C from './global.config.js';


export const en_us = FSX.readJSONSync('./data/base/en_us.json');
export const zh_cn = FSX.readJSONSync('./data/base/zh_cn.json');

export const all = { en_us, zh_cn };

export const D = all[C.lang] || en_us;