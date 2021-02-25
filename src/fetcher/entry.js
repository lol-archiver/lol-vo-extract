module.exports = async function fetchEntry(region, solution, sie) {
	if(C.manifest) {
		L(`[fetchEntry] Detect Manifest [${C.manifest}] version [${C.version || 1}]`);

		return [[_ul.resolve(C.cdn, `channels/public/releases/${C.manifest}.manifest`)], C.version || 1];
	}

	const urlEntry = _ul.resolve(sie, `/api/v1/products/lol/version-sets/${region}?q[artifact_type_id]=lol-game-client&q[platform]=windows`);

	L(`[fetchEntry] Fetch from [${urlEntry}]`);

	const { data } = await Axios.get(urlEntry, { proxy: C.proxy || undefined, timeout: 1000 * 60 * 4 });

	const content = region == 'PBE1' ? 'beta' : 'release';

	const releases = data.releases.filter(release => release.release.labels.content.values[0] == content);

	const versionLatest = C.version || Math.max(...releases.map(release => ~~release.release.labels['riot:revision'].values[0]));

	L(`[fetchEntry] Latest [${content}] version [${versionLatest}]`);

	return [
		data.releases
			.filter(release => release.release.labels['riot:revision'].values[0] == versionLatest)
			.map(release => release.download.url),
		versionLatest
	];
};