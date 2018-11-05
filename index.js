const nanoid = require('nanoid');

function nanoidPlugin(schema, length) {
    let _id = '_id';
    const dataObj = {};

    if (!length) length = 12;

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
