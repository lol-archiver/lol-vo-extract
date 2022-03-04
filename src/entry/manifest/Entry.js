import Axios from 'axios';
import HttpsProxyAgent from 'https-proxy-agent';
import joinURL from 'url-join';

import { C, G, TT } from '../../../lib/global.js';


class Entry {
	static async fetch() {
		const url = joinURL(C.server.sie, `/api/v1/products/lol/version-sets/${C.server.region}?q[artifact_type_id]=lol-game-client&q[platform]=windows`);

		G.debugU(TT('fetchEntry:where'), TT('fetchEntry:do'), TT('fetchEntry:ing', { url }));

		const { data } = await Axios.get(url, { proxy: C.server.proxy ? new HttpsProxyAgent(C.server.proxy) : false, timeout: 1000 * 60 * 4 });

		G.debugD(TT('fetchEntry:where'), TT('fetchEntry:do'), TT('fetchEntry:ok', { url }));

		return data;
	}
}

export default Entry;