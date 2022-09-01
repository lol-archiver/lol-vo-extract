import Axios from 'axios';
import HttpsProxyAgent from 'https-proxy-agent';
import joinURL from 'url-join';

import { C, G } from '@nuogz/pangu';

import { T } from '../../../lib/i18n.js';



export default class Entry {
	static async fetch() {
		const url = joinURL(C.server.sie, `/api/v1/products/lol/version-sets/${C.server.region}?q[artifact_type_id]=lol-game-client&q[platform]=windows`);

		G.debugU(T('fetchEntry:where'), T('fetchEntry:do'), T('fetchEntry:ing', { url }));

		const { data } = await Axios.get(url, { proxy: C.server.proxy ? new HttpsProxyAgent(C.server.proxy) : false, timeout: 1000 * 60 * 4 });

		G.debugD(T('fetchEntry:where'), T('fetchEntry:do'), T('fetchEntry:ok', { url }));

		return data;
	}
}
