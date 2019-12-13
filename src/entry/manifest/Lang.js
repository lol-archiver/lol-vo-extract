module.exports = function Lang(langID, lang) {
	if(!(this instanceof Lang)) {
		return new Lang(...arguments);
	}

	this.langID = langID;
	this.lang = lang;
};