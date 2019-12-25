module.exports = function makeWadList() {
	L(`[Main] Make need-fetched Wad list`);

	const nameVoiceWad = `${C.hero}.${C.lang}.wad.client`.toLowerCase();
	const pathVoiceWad = RD('_cache', 'assets', nameVoiceWad);

	const nameSkinWad = `${C.hero}.wad.client`.toLowerCase();
	const pathSkinWad = RD('_cache', 'assets', nameSkinWad);

	const arrFetchFile = [];

	if(!_fs.existsSync(pathVoiceWad) || C.cache == false) {
		arrFetchFile.push([nameVoiceWad, pathVoiceWad]);
	}

	if(!_fs.existsSync(pathSkinWad) || C.cache == false) {
		arrFetchFile.push([nameSkinWad, pathSkinWad]);
	}

	return [arrFetchFile, pathVoiceWad, pathSkinWad];
};