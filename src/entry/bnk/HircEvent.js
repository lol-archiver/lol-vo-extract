module.exports = function HircEvent(id, count) {
	if(!(this instanceof HircEvent)) {
		return new HircEvent(...arguments);
	}

	this.id = id;

	this.count = count;
	this.eventActions = null;
};