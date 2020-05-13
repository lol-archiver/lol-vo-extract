module.exports = function Manifest(url, version) {
	if(!(this instanceof Manifest)) {
		return new Manifest(...arguments);
	}

	this.url = url;
	this.version = version;
	this.files = null;
};