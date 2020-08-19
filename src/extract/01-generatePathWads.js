const detectFetch = function(wadsToFetch, nameWad, pathWad, isUseClient) {
	const isExist = _fs.existsSync(pathWad);

	if(isUseClient && !isExist) {
		throw `[Error] Use Client Wad. But Wad[${pathWad}] doesn't exist`;
	}
	else if(C.useWADLevel == 1 || !isExist) {
		wadsToFetch.push([nameWad, pathWad]);
	}
};

module.exports = function generateWadsToFetch() {
	L(`[Main] Make a list of wads to be fetched`);

	const nameWadVoice = `${C.champ}.${C.lang}.wad.client`.toLowerCase();
	const nameWadChamp = `${C.champ}.wad.client`.toLowerCase();

	const isUseClient = C.useWADLevel == 2 && C.path.game;

	const pathWadVoice = isUseClient ?
		R(C.path.game, 'Game', 'DATA', 'FINAL', 'Champions', nameWadVoice) :
		RD('_cache', 'assets', nameWadVoice);
	const pathWadChamp = isUseClient ?
		R(C.path.game, 'Game', 'DATA', 'FINAL', 'Champions', nameWadChamp) :
		RD('_cache', 'assets', nameWadChamp);

	const wadsToFetch = [];

	detectFetch(wadsToFetch, nameWadVoice, pathWadVoice, isUseClient);
	detectFetch(wadsToFetch, nameWadChamp, pathWadChamp, isUseClient);

	return [pathWadVoice, pathWadChamp, wadsToFetch];
};