module.exports = function HircAction(id, scope, actionType, hircID, paramCount) {
	if(!(this instanceof HircAction)) {
		return new HircAction(...arguments);
	}

	this.id = id;

	this.scope = scope;
	this.actionType = actionType;
	this.hircID = hircID;
	this.paramCount = paramCount;

	this.paramTypes = null;
	this.params = null;
};