import { readFileSync } from 'fs';

export default {
	zh_cn: JSON.parse(readFileSync('./data/BaseData/zh_cn.json')),
	en_us: JSON.parse(readFileSync('./data/BaseData/en_us.json')),
};