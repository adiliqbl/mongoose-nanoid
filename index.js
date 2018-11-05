const nanoid = require('nanoid');

function nanoidPlugin(schema, options) {
    let _id = '_id';
    const dataObj = {};
    let length = 12;

    if (options) {
        if (options instanceof String) {
            length = Number(options)
        } else if (options instanceof Number) {
            length = options;
        } else if (options instanceof Object) {
            if (options && options.length) {
                length = options.length;
            }
        }
    }

    dataObj[_id] = {
        type: String,
        default: function () {
            return nanoid(length)
        }
    };

    schema.add(dataObj);
    schema.pre('save', function (next) {
        if (this.isNew) {
            attemptToGenerate(this, length)
                .then(function (newId) {
                    this[_id] = newId;
                    next()
                })
                .catch(next)
        } else next();
    });
}

function attemptToGenerate(doc, length) {
    const id = nanoid(length);
    return doc.constructor.findById(id)
        .then(function (found) {
            if (found) return attemptToGenerate(doc, length);
            return id
        })
}

module.exports = nanoidPlugin;
