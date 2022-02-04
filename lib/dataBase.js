import FSX from 'fs-extra';

import { C } from './global.js';


export const en_us = FSX.readJsonSync('./data/BaseData/en_us.json');
export const zh_cn = FSX.readJsonSync('./data/BaseData/zh_cn.json');

export const all = { en_us, zh_cn };

const now = () => all[C.lang] || en_us;

export default now;