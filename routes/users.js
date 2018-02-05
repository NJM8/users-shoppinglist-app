const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');

  // GET /users - this page should list all of the users, but should only be accessible if the user has an isAdmin property of true.


  // GET /users/:id - this page should show a specific user's information and should only be accessible by the user logged in or another user that has an isAdmin property of true.

router
  .route('/')
  // GET / - this page should redirect to the users/login route if the user is not authenticated.
  .get(authMiddleware.loginRequired, (req, res, next) => {
    return res.render('index');
  });

router
  .route('/signup')
  // GET /users/signup - this page should render a form for a user to sign up unless the user is already logged in, if they are it should redirect to the /users/:id route.
  .get((req, res, next) => {
    return res.render('newUser');
  })
  // POST /users - this page should create a new user and log them in. Afterwards, it should redirect them to the /users/:id route.
  .post(authMiddleware.verifyAdmin, (req, res, next) => {
    if (req.body.adminPassword) {
      if (req.body.adminPassword !== process.env.adminPassword) {
        req.flash('message', 'Incorrect admin password');
        return res.redirect('/users/signup');
      }
    }
    if (req.body.password !== req.body.confirmPassword) {
      req.flash('message', 'Passwords do not match');
      return res.redirect('/users/signup');
    } else {
      return db.User.create(req.body).then(user => {
        req.flash('message', 'Signed up, now log in please');
        return res.redirect('/users/login');
      }).catch(err => {
        if (err.code === 11000) {
          req.flash('message', 'That username already exists, login or use a different username');
          res.redirect('/');
        }
        return next(err);
      });
    }
  });

router
  .route('/login')
  // GET /users/login - this page should render a form for a user to login unless the user is already logged in, if they are it should redirect to the /users/:id route.
  .get((req, res, next) => {
    return res.render('login', { username: req.session.username });
  })
  // POST /users/login - this page should authenticate a user and if the user successfully authenticates, it should redirect them to the /users/:id route.
  .post((req, res, next) => {
    return db.User.findOne({'username': req.body.username}).then(function(user){
      if (!user) {
        req.flash('message', 'Invalid Username, do you need to sign up?')
        return res.redirect('/users/login');
      }
      user.comparePassword(req.body.password, function(err, isMatch){
        if (isMatch) {
          req.session.user_id = user.id;
          req.session.username = user.username;
          req.flash('message', 'Logged in!');
          return res.render('showUser', { user, message: req.flash('message') });
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
  .route('/:user_id/edit')
  // GET /users/:id/edit - this page render a form to edit a specific user's information and should only be accessible by the user logged in or another user that has an isAdmin property of true.
  .get(authMiddleware.ensureCorrectUser, (req, res, next) => {
    return db.User.findById(req.params.user_id).then(user => {
      return res.render('editUser', { user });
    }).catch(err => {
      return next(err);
    });
  })
  // PATCH /users/:id - this route should update a users information and should only be accessible by the user logged in or another user that has an isAdmin property of true.
  .patch(authMiddleware.ensureCorrectUser, (req, res, next) => {
    if (req.body.password !== req.body.confirmPassword) {
      return db.User.findById(req.params.user_id).then(user => {
        req.flash('message', 'Old passwords do not match');
        return res.render('editUser', { user });
      }).catch(err => {
        return next(err);
      });
    }

    if (req.body.newPassword) {
      if (req.body.newPassword !== req.body.confirmNewPassword) {
        return db.User.findById(req.params.user_id).then(user => {
          req.flash('message', 'New passwords do not match');
          return res.render('editUser', { user });
        }).catch(err => {
          return next(err);
        });
      }
    }

    return db.User.findById(req.params.user_id).then(user => {
      user.comparePassword(req.body.password, function(err, isMatch){
        if (isMatch) {
          if (user.name !== req.body.username) {
            user.username = req.body.username;
          }
          if (req.body.newPassword){
            user.password = req.body.newPassword;
          }
          user.save().then(user => {
            return res.render('showUser', { user });
          }).catch(err => {
            return next(err);
          });        
        }
      });
    }).catch(err => {
      return next(err);
    })
  })
  // DELETE /users/:id - this route should delete user and should only be accessible by the user logged in or another user that has an isAdmin property of true.
  .delete(authMiddleware.ensureCorrectUser, (req, res, next) => {
    if (req.body.password !== req.body.confirmPassword) {
      return db.User.findById(req.params.user_id).then(user => {
        req.flash('message', 'Passwords do not match');
        return res.render('editUser', { user });
      }).catch(err => {
        return next(err);
      });
    }
    return db.User.findById(req.params.user_id).then(user => {
      user.comparePassword(req.body.password, function(err, isMatch){
        if (isMatch) {
        req.session.user_id = null;
        req.session.username = null;
        user.remove();
        return res.redirect('/users');
        }
      })
    }).catch(err => {
      return next(err);
    })
  });

router
  .route('/login/diff')
  .get((req, res, next) => {
    req.session.user_id = null;
    req.session.username = null;
    return res.redirect('/users/login');
  })

router
  .route('/logout')
  .get((req, res, next) => {
    req.session.user_id = null;
    req.session.username = null;
    req.flash('message', 'Logged out!');
    return res.redirect('/');
  });


module.exports = router;


