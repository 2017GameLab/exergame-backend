var express = require('express');
var router = express.Router();
var Workout = require('../models/workout');
var User = require('../models/user')
var xml = require('xml');

var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// router.post('/register', function (req, res, next) {
//
// });

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

router.get('/:id/workouts', function (req, res, next) {
  var userId = req.params.id;
  var from = req.query.from;
  var to = req.query.to;
  Workout.find({
    'userId': userId,
    'workoutDate': {
      $gte: new Date(from),
      $lt: new Date(to)
    }
  }, function (workouts) {
    res.send(xml(results))
  });
});

module.exports = router;
