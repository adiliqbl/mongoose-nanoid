const { nanoid, customAlphabet } = require('nanoid');

const DEFAULT_LENGTH = 12;

function generator(opts) {
	return opts.alphabets ? customAlphabet(opts.alphabets, DEFAULT_LENGTH) : nanoid
}

function nanoidPlugin(schema, opts) {
	if (schema.options._id !== undefined && schema.options._id === false) return;

	if (typeof opts == 'number') {
		opts = { length: opts }
	}

	opts.length = opts.length || DEFAULT_LENGTH;

	let _id = '_id';
	const dataObj = {};

	dataObj[_id] = {
		type: String,
		default: function () {
			return generator(opts)(opts.length);
		}
	};

	schema.add(dataObj);
	schema.pre('save', function (next) {
		if (this.isNew && !this.constructor.$isArraySubdocument) {
			attemptToGenerate(this, opts)
				.then(function (newId) {
					this[_id] = newId;
					next()
				})
				.catch(next)
		} else next();
	});
}

function attemptToGenerate(doc, opts) {
	const id = generator(opts)(opts.length);
	return doc.constructor.exists({ _id: id })
		.then(function (found) {
			if (found) return attemptToGenerate(doc, opts.length);
			return id
		})
}

module.exports = nanoidPlugin;
