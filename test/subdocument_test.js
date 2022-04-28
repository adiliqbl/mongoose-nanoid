const mocha = require('mocha');
const should = require('should');
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let { nanoid } = require('nanoid');

mongoose.plugin(require('../index'), 12);
mongoose = mongoose.createConnection('mongodb://localhost/test');
mongoose.on('error', function (err) {
    console.error('MongoDB error: ' + err.message);
    console.error('Make sure a mongoDB server is running and accessible by this application')
});


const SubDocSchema = new Schema({
    name: String,
    sub: [new Schema({
        value: {type: Number},
        type: {type: Boolean}
    }, {_id: false})]
});

const SubDoc = mongoose.model('Test', SubDocSchema);

describe('Sub document Test', function () {
    it('should save', function (done) {

        const sub = [{value: 1, type: false}, {value: 2, type: true},
            {value: 3, type: false}, {value: 4, type: true}];

        const subDoc = new SubDoc({
            name: 'John Doe',
            sub: sub
        });

        subDoc.save(function (err) {
            if (err) console.error(err);
            done();
        });
    });

    after(function () {
        mongoose.close();
    });
});
