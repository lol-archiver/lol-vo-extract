import { readJsonSync } from 'fs-extra';

export default {
	zh_cn: readJsonSync('./data/BaseData/zh_cn.json'),
	en_us: readJsonSync('./data/BaseData/en_us.json'),
};