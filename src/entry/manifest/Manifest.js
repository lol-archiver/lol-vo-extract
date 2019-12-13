module.exports = function Manifest(patchURL, version, cdn) {
	if(!(this instanceof Manifest)) {
		return new Manifest(...arguments);
	}

	this.patchURL = patchURL;
	this.version = version;
	this.cdn = cdn;
};