module.exports = async function(region, solution, sie) {
	let entryURL = _ul.resolve(sie, `/api/v1/products/lol/version-sets/${region}?q[artifact_type_id]=lol-game-client&q[platform]=windows`);

	L(`[Version] fetch from '${entryURL}'`);

	let { data } = await Axios.get(entryURL, { proxy: C.proxy || undefined });

	let arrRelease = data.releases.filter(release => release.release.labels.branch.values[0] == 'main');

	const version = Math.max(...data.releases.map(release => ~~release.release.labels['riot:revision'].values[0]));

	L(`[Version] ${version}`);

	return [
		arrRelease
			.filter(release => release.release.labels['riot:revision'].values[0] == version)
			.map(release => release.download.url),
		version
	];
};