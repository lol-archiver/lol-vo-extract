import { readJsonSync } from 'fs-extra';


export const zh_cn = readJsonSync('./data/BaseData/zh_cn.json');
export const en_us = readJsonSync('./data/BaseData/en_us.json');