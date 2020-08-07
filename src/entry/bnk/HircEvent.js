module.exports = class HircEvent {
	constructor(id, count) {
		this.id = id;

		this.count = count;
		this.eventActions = null;
	}
};