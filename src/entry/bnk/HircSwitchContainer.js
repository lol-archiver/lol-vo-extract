module.exports = function HircSwitchContainer(id) {
	if(!(this instanceof HircSwitchContainer)) {
		return new HircSwitchContainer(...arguments);
	}

	this.id = id;

	this.arrContainerID = [];
};