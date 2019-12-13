module.exports = async function(channel, solution, cdn) {
	let entryURL = _ul.resolve(cdn, `channels/public/${channel}.json`);

	L(`[Version] fetch from '${entryURL}'`);
	let { data } = await Axios.get(entryURL, { proxy: C.proxy || undefined });

	L(`[Version] ${data.version}`);

	return [data[solution + '_patch_url'], data.version];
};