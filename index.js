require('./env');

L(`[Hero] ${C.hero} [Language] ${C.lang}`);
L(`[Channel] ${C.channel} [Solution] ${C.solution} [CDN] ${C.cdn}`);

const Downloader = require('./src/part/download');

(async function main() {
	let version = await Downloader([
		`${C.hero.toLowerCase()}.${C.lang}.wad.client`,
		`${C.hero.toLowerCase()}.wad.client`,
	]);

	L.end(version);
})();