module.exports = async function(region, solution, sie) {
	let entryURL = _ul.resolve(sie, `/api/v0/products/lol/version-sets/${region}`);

	L(`[Version] fetch from '${entryURL}'`);

	let { data } = await Axios.get(entryURL, { proxy: C.proxy || undefined });

	const version = Math.max(...data.releases.map(release => ~~release.release.labels['riot:revision'].values[0]));

	let arrRelease = data.releases.filter(release =>
		release.release.labels.branch.values[0] == 'main' &&
		release.release.labels['riot:revision'].values[0] == version &&
		release.release.labels['riot:platform'].values.join('') == 'windows'
	);

	L(`[Version] ${version}`);

	return [arrRelease.map(release => release.download.url), version];
};