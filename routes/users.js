const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');

router
  .route('/')
  .get(authMiddleware.loginRequired, (req, res, next) => {
    return res.render('index');
  });

router
  .route('/login')
  .get((req, res, next) => {
    return res.render('login');
  })
  .post((req, res, next) => {
    return db.User.findOne({'username': req.body.username}).then(function(user){
      if (!user) {
        req.flash('message', 'Invalid Username, do you need to sign up?')
        return res.redirect('/users/login');
      }
      user.comparePassword(req.body.password, function(err, isMatch){
        if (isMatch) {
          req.session.user_id = user.id;
          req.flash('message', 'Logged in!');
          return res.render('showUser', { user });
        } else {
          req.flash('message', 'Invalid password!');
          return res.redirect('/users/login');
        }
      })
    }).catch(err => {
      return next(err);
    })
  });

router
  .route('/signup')
  .get((req, res, next) => {
    return res.render('newUser');
  })
  .post((req, res, next) => {
    if (req.body.password !== req.body.confirmPassword) {
      req.flash('message', 'Passwords do not match');
      return res.redirect('/users/signup');
    } else {
      return db.User.create(req.body).then(user => {
        req.flash('message', 'Signed up, now log in please');
        return res.redirect('/users/login');
      }).catch(err => {
        return next(err);
      });
    }
  });


router
  .route('/logout')
  .get((req, res, next) => {
    req.session.user_id = null;
    req.flash('message', 'Logged out!');
    return res.redirect('/');
  });


module.exports = router;


