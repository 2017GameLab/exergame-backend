var express = require('express');
var router = express.Router();
var Workout = require('../models/workout');
var ExerciseDotCom = require('../models/sources/exercise-dot-com');
var User = require('../models/user');
var getByEmail = require('../misc/tasks');
var transformerFactory = require('../transformers/transformerFactory');
var ObjectId = require('mongoose').Types.ObjectId;
var log = require('../misc/logger');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
	function (username, password, done) {
		User.findOne({ username: username }, function (err, user) {
			if (err) {
				log.error(err);
				return done(err);
			}

			if (!user) {
				log.warn('Incorrect Username');
				return done(null, false, { message: 'Incorrect username.' });
			}

			if (!user.validPassword(password)) {
				log.warn('Incorrect Password');
				return done(null, false, { message: 'Incorrect password.' });
			}

			log.info('login successful');
			return done(null, user);
		});
	}
));

passport.serializeUser(function (user, done) {
	log.info('serializing user');
	done(null, user._id);
});

passport.deserializeUser(function (id, done) {
	log.info('deserializing user');
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

router.post('/login', passport.authenticate('local', {
	successRedirect: '/',
	failureRedirect: '/login',
	failureFlash: true
}));

router.get('/:id/forceUpdate', function (req, res, next) {
	var userId = decodeURIComponent(req.params.id);
	log.info('fetching data from exercise service with force update');
	getByEmail(userId);
	res.send({
		data: {
			started: 'true'
		}
	});
});

router.get('/:id/workouts/:format/:from/:to', function (req, res, next) {
	log.info('workouts requested');
	var userId = decodeURIComponent(req.params.id);
	var format = decodeURIComponent(req.params.format);
	var from = parseInt(req.params.from); // In seconds for Skyrim
	var to = parseInt(req.params.to); // In seconds for Skyrim
	var sendData = {
		data: {}
	};

	log.debug('transformer class instantiated');
	var transformer = transformerFactory(format);

	User.find({
		email: userId
	}, function (err, users) {
		if (users.length === 0) {
			sendData.data = {
				errorCode: '404',
				errorMessage: 'User not found'
			};
			log.warn('user not found');
			res.status(404).send(sendData);
		} else if (!transformer) {
			log.warn(`No such format: ${format}`);
			sendData.data = {
				errorCode: '404',
				errorMessage: `No such format: ${format}`
			};
			res.status(404).send(sendData);
		} else if(Number.isInteger(from) && Number.isInteger(to) && from >= 0 && to >= 0 && from < to) {
			ExerciseDotCom.find({
				userEmail: userId,
				dateRetrieved: {
					$gt: new Date(from * 1000),
					$lt: new Date(to * 1000)
				}
			},
			function (err, workouts) {
				if (err) {
					log.warn(err);
					res.send(err);
					return;
				}

				log.info('workouts found, transforming and sending');
				sendData.data.workouts = transformer.transform(workouts);

				// Return data.
				res.send(sendData);
			});
		} else {
			sendData.data = {
				errorCode: '400',
				errorMessage: 'Invalid date(s)'
			};
			log.warn('invalid dates specified for workout fetch');
			res.status(400).send(sendData);
		}
	});
});

module.exports = router;
