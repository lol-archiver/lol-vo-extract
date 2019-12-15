module.exports = function HircPool(id) {
	if(!(this instanceof HircPool)) {
		return new HircPool(...arguments);
	}

	this.id = id;

	this.soundIDs = [];
};