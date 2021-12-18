const mocha = require('mocha');
const should = require('should');
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let { nanoid } = require('nanoid');

mongoose = mongoose.createConnection('mongodb://localhost/test');
mongoose.on('error', function (err) {
    console.error('MongoDB error: ' + err.message);
    console.error('Make sure a mongoDB server is running and accessible by this application')
});

const fieldName = '_id';
const length = 12;


const IdCheckSchema = new Schema({
    email: String
});

const RefCheckSchema = new Schema({
    idcheck: {
        type: String,
        ref: 'IdCheck'
    }
});

IdCheckSchema.plugin(require('../index'), length);
RefCheckSchema.plugin(require('../index'), length);

const IdCheck = mongoose.model('IdCheck', IdCheckSchema);
const RefCheck = mongoose.model('RefCheck', RefCheckSchema);

describe('SchemaId Test', function () {
    it('should have the _id field created by nanoid', function (done) {
        const nameOnlySchema = new IdCheck({email: 'mail@test.com'});
        nameOnlySchema.save(function (err) {
            nameOnlySchema.should.have.property(fieldName);
            nameOnlySchema[fieldName].should.be.a.String;
            nameOnlySchema[fieldName].length.should.be.belowOrEqual(length);
            done();
        });
    });

    it('should have same _id on saving', function (done) {
        IdCheck.findOne({email: 'mail@test.com'}, function (err, found) {
            console.log(found);
            found.email = 'newmail@test.com';
            found.save(function (err, updated) {
                updated[fieldName].should.be.equal(found[fieldName]);
                done();
            });
        });
    });

    it('should have ref populated', function (done) {
        IdCheck.findOne({email: 'newmail@test.com'}, function (err, found) {
            const refCheck = new RefCheck({idcheck: found[fieldName]});
            refCheck.save(function (err) {
                refCheck.should.have.property(fieldName);
                refCheck[fieldName].should.be.a.String;
                refCheck[fieldName].length.should.be.belowOrEqual(length);
                RefCheck.findById(refCheck[fieldName])
                    .populate('idcheck')
                    .then(function (newFound) {
                        newFound.idcheck[fieldName].should.be.equal(found[fieldName]);
                        newFound.idcheck.should.have.property('email');
                        newFound.idcheck.email.should.be.equal(found.email);
                        done();
                    })
                    .catch(function (error) {
                        console.log(error)
                    });
            });
        });
    });

    it('nanoid should create unique id', function (done) {
        this.timeout(15000);

        let list = [];
        for (let i = 0; i < 1000; i++) {
            list.push(nanoid(length))
        }


        for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
                list[i].should.not.be.equal(list[j]);
            }
        }

        done();
    });

    after(function () {
        mongoose.close();
    });
});
