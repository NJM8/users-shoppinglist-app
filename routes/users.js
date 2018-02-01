const express = require('express');
const router = express.router();
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
    return db.User.fineOne({name: req.body.username}).then(user => {
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch) {
          req.session.user_id = user.id;
          req.flash('message', 'Logged in!');
          return res.redirect('/showUser');
        } else {
          req.flash('message', 'Invalid credentials!');
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
    db.User.create(req.body).then(user => {
      return res.redirect('/users/login');
    })
  });

router
  .route('/logout')
  .get((req, res, next) => {
    req.session.user_id = null;
    req.flash('message', 'Logged out!');
    return res.redirect('/users/login');
  });


module.exports = router;