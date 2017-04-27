'use strict'

function jsonDataGenerator(method, data, headers) {
	headers['Content-Type'] = "application/json";
	return JSON.stringify(data);
}

module.exports = jsonDataGenerator;