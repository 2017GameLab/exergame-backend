var assert = require('assert');
var request = require('supertest');
var mongoose = require('mongoose');
var http = require('http');
var bCrypt = require('bcrypt-nodejs');
var parseString = require('xml2js').parseString;

var server = require('../index');
var db = require('../db');
var User = require('../models/user');
var Workout = require('../models/sources/exercise-dot-com');

describe('/users', function() {
	var url = 'http://localhost:3000';

	before(function(done) {
		// In our tests we use the test db
		mongoose.connection.close(function (err) {
			if (err) {
				console.error(err);
			}
			mongoose.connect(db.testUrl, function (err) {
				if (err) {
					console.error(err);
				}

				// Populate Database
				var dummyUser = new User({
					username: 'example@example.com',
					password: 'f$1-ien-J9J-0Pb',
					email: 'example@example.com',
					firstName: 'Test',
					lastName: 'User',
					credentials: {}
				});
				dummyUser.save(function (err) {
					if(err) {
						console.error(err);
					}
					var dummyUser2 = new User({
						username: 'hasdata@example.com',
						password: 'f$1-ien-J9J-0Pb',
						email: 'hasdata@example.com',
						firstName: 'Test',
						lastName: 'User',
						credentials: {}
					});
					dummyUser2.save(function (err) {
						var workoutData = require('./data/exercise.json');
						workoutData.dateRetrieved = new Date();
						var dummyWorkout = new Workout(workoutData);
						dummyWorkout.save(function (err) {
							if(err) {
								console.error(err);
							}
							done();
						});
					});
				});
			});
		});
	});

	after(function (done) {
		User.remove({firstName: 'Test'}, function () {
			Workout.remove({userEmail: 'hasdata@example.com'}, function () {
				done();
			});
		});
	});

	describe('/{id}/workouts/{from}/{to}', function() {
		it('should return an empty workouts xml if the user exists but has no data.', function(done) {
			// Make the request
			request(url)
			.get('/users/example%40example.com/workouts/0/9999999999999')
			// end handles the response
			.end(function(err, res) {
				assert.ifError(err);

				assert.equal(res.status, 200, 'request returned an error');

				parseString(res.text, function (err, data) {
					assert.deepEqual(data.data, {
						workouts: [''],
					});
					done();
				});
			});
		});

		it('should data as xml if the user exists and has data.', function(done) {
			// Make the request
			request(url)
			.get('/users/hasdata%40example.com/workouts/0/1500000000000')
			// end handles the response
			.end(function(err, res) {
				assert.ifError(err);

				assert.equal(res.status, 200, 'request returned an error');

				parseString(res.text, function (err, data) {
					data.data.workouts[0].workout[0].syncDate[0] = 'Untestable';
					assert.deepEqual(data.data, {
						workouts: [{
							workout: [
								{
									health: [
										'0'
									],
									magicka: [
										'0'
									],
									stamina: [
										'1001'
									],
									syncDate: [
										'Untestable'
									],
									workoutDate: [
										'1463011200'
									]
								}
							]
						}]
					});
					done();
				});
			});
		});

		it('should return 400 if the user exists but from date is invalid', function(done) {
			// Make the request
			request(url)
			.get('/users/example%40example.com/workouts/-1/100')
			// end handles the response
			.end(function(err, res) {
				assert.ifError(err);

				assert.equal(res.status, 400, 'request returned an error');

				parseString(res.text, function (err, data) {
					assert.deepEqual(data.data, {
						errorCode: ['400'],
						errorMessage: ['Invalid date(s)']
					});
					done();
				});
			});
		});

		it('should return 400 if the user exists but to date is invalid', function(done) {
			// Make the request
			request(url)
			.get('/users/example%40example.com/workouts/100/word')
			// end handles the response
			.end(function(err, res) {
				assert.ifError(err);

				assert.equal(res.status, 400, 'request returned an error');

				parseString(res.text, function (err, data) {
					assert.deepEqual(data.data, {
						errorCode: ['400'],
						errorMessage: ['Invalid date(s)']
					});
					done();
				});
			});
		});

		it('should return 400 if the user exists but from dates are not in order', function(done) {
			// Make the request
			request(url)
			.get('/users/example%40example.com/workouts/100/50')
			// end handles the response
			.end(function(err, res) {
				assert.ifError(err);

				assert.equal(res.status, 400, 'request returned an error');

				parseString(res.text, function (err, data) {
					assert.deepEqual(data.data, {
						errorCode: ['400'],
						errorMessage: ['Invalid date(s)']
					});
					done();
				});
			});
		});

		it('should return a 404 error if the user does not exist', function(done) {
			// Make the request
			request(url)
			.get('/users/fakeuser/workouts/0/9999999999999')
			// end handles the response
			.end(function(err, res) {
				assert.ifError(err);

				assert.equal(res.status, 404, 'request returned an error');

				parseString(res.text, function (err, data) {
					assert.deepEqual(data.data, {
						errorCode: ['404'],
						errorMessage: ['User not found']
					});
					done();
				});
			});
		});
	});
});