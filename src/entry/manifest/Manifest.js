module.exports = class Manifest {
	constructor(url, version) {
		this.url = url;
		this.version = version;
		this.files = null;
	}
};