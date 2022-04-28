require('mocha');
require('should');
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let { nanoid, customAlphabet } = require('nanoid');

mongoose = mongoose.createConnection('mongodb://localhost/test');
mongoose.on('error', function (err) {
	console.error('MongoDB error: ' + err.message);
	console.error('Make sure a mongoDB server is running and accessible by this application')
});

const fieldName = '_id';
const options = {
	length: 12,
	alphabets: "abcdefgh@"
}

const IdCheckNormalSchema = new Schema({
	email: String
});

const IdCheckAlphebtsSchema = new Schema({
	email: String
});

const RefCheckSchema = new Schema({
	idcheck: {
		type: String,
		ref: 'IdCheck'
	}
});

IdCheckNormalSchema.plugin(require('../index'), options.length);
IdCheckAlphebtsSchema.plugin(require('../index'), options);
RefCheckSchema.plugin(require('../index'), options);

const IdCheck = mongoose.model('IdCheck', IdCheckNormalSchema);
const IdCheckAlphabets = mongoose.model('IdCheckAlphabets', IdCheckAlphebtsSchema);
const RefCheck = mongoose.model('RefCheck', RefCheckSchema);

describe('SchemaId Test', function () {
	it('should have the _id field created by nanoid', function (done) {
		const validate = (schema) => {
			schema.should.have.property(fieldName);
			schema[fieldName].should.be.a.String;
			schema[fieldName].length.should.be.belowOrEqual(options.length);
		};

		const nameOnlySchema = new IdCheck({ email: 'mail@test.com' });
		validate(nameOnlySchema);
		nameOnlySchema.save(function () {
			validate(nameOnlySchema);
			done();
		});
	});

	it('should have the _id field created by nanoid.customAlphabet', function (done) {
		const validate = (schema) => {
			schema.should.have.property(fieldName);
			schema[fieldName].should.be.a.String;
			schema[fieldName].should.match(new RegExp(`[${options.alphabets}]+$`))
			schema[fieldName].length.should.be.belowOrEqual(options.length);
		};

		const nameOnlySchema = new IdCheckAlphabets({ email: 'mail@test.com' });
		validate(nameOnlySchema);
		nameOnlySchema.save(function () {
			validate(nameOnlySchema);
			done();
		});
	});

	it('should have same _id on saving', function (done) {
		IdCheck.findOne({ email: 'mail@test.com' }, function (err, found) {
			found.email = 'newmail@test.com';
			found.save(function (err, updated) {
				updated[fieldName].should.be.equal(found[fieldName]);
				done();
			});
		});
	});

	it('should have ref populated', function (done) {
		IdCheck.findOne({ email: 'newmail@test.com' }, function (err, found) {
			const refCheck = new RefCheck({ idcheck: found[fieldName] });
			refCheck.save(function () {
				refCheck.should.have.property(fieldName);
				refCheck[fieldName].should.be.a.String;
				refCheck[fieldName].length.should.be.belowOrEqual(options.length);
				RefCheck.findById(refCheck[fieldName])
					.populate('idcheck')
					.then(function (newFound) {
						newFound.idcheck[fieldName].should.be.equal(found[fieldName]);
						newFound.idcheck.should.have.property('email');
						newFound.idcheck.email.should.be.equal(found.email);
						done();
					})
					.catch(function (error) {
						console.error(error)
					});
			});
		});
	});

	it('nanoid should create unique id', function (done) {
		this.timeout(15000);

		const nanoidCustom = customAlphabet(options.alphabets, 12)

		let list1 = [];
		let list2 = [];
		for (let i = 0; i < 1000; i++) {
			list1.push(nanoid(options.length))
			list2.push(nanoidCustom(options.length))
		}

		for (let i = 0; i < list1.length; i++) {
			for (let j = i + 1; j < list1.length; j++) {
				list1[i].should.not.be.equal(list1[j]);
			}
		}

		for (let i = 0; i < list2.length; i++) {
			for (let j = i + 1; j < list2.length; j++) {
				list2[i].should.not.be.equal(list2[j]);
			}
		}

		done();
	});

	after(function () {
		mongoose.close();
	});
});
