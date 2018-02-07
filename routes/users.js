const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');

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
    } else if (!(/.{8}/).test(req.body.password)){
      req.flash('message', 'Password does not meet requirements');
      return res.redirect('/users/signup');
    } else {
      return db.User.create(req.body).then(user => {
        req.flash('message', 'Signed up, welcome');
        req.session.user_id = user.id;
        req.session.username = user.username;
        return res.redirect(`/users/${user.id}`);
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
  // GET /users/login - this page should render a form for a user to login.
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
          return res.redirect(`/users/${user.id}`);
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
  .route('/logout')
  // GET /users/logout - This route is used to log out a user.
  .get((req, res, next) => {
    console.log('LOGGING OUT')
    req.session.user_id = null;
    req.session.username = null;
    req.flash('message', 'Logged out!');
    return res.redirect('/');
  });

router
  .route('/login/diff')
  // GET /users/login/diff - This is used to logout the stored user at the login page and login a different user
  .get((req, res, next) => {
    req.session.user_id = null;
    req.session.username = null;
    return res.redirect('/users/login');
  });

router
  .route('/:user_id')
  // GET /users/:user_id - This route should show a users page after they have been logged in.
  .get((req, res, next) => {
    return db.User.findById(req.params.user_id).populate('items').exec().then(user => {
      return res.render('showUser', { user });
    }).catch(err => {
      return next(err);
    });
  });

router
  .route('/:user_id/edit')
  // GET /users/:id/edit - this page render a form to edit a specific user's information and should only be accessible by the user logged in.
  .get(authMiddleware.ensureCorrectUser, (req, res, next) => {
    return db.User.findById(req.params.user_id).then(user => {
      return res.render('editUser', { user });
    }).catch(err => {
      return next(err);
    });
  })
  // PATCH /users/:id - this route should update a users information and should only be accessible by the user logged in.
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
  // DELETE /users/:id - this route should delete user and should only be accessible by the user logged in.
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
        req.flash('message', 'User and all associated items deleted');
        return res.redirect('/users');
        }
      })
    }).catch(err => {
      return next(err);
    })
  });

router
  .route('/allUsers/:admin_id')  
  // GET /users - this page should list all of the users, but should only be accessible if the user has an isAdmin property of true.
  .get((req, res, next) => {
    return db.User.findById(req.params.admin_id).then(admin => {
      return db.User.find({'isAdmin': false}).then(allUsers => {
        return res.render('allUsers', { admin, allUsers });
      }).catch(err => {
        return next(err);
      });
    }).catch(err => {
      return next(err);
    });
  });

router
  .route('/admin/:admin_id/deleteUser/:user_id')
  // GET /users/admin/:admin_id/deleteUser/:user_id - this route can be used by admin to delete another user.
  .delete((req, res, next) => {
    db.User.findById(req.params.user_id).then(user => {
      user.remove();
      req.flash('message', `${user.username} and all their items have been deleted`);
      return res.redirect(`/users/allUsers/${req.params.admin_id}`);
    }).catch(err => {
      return next(err);
    });
  });


module.exports = router;


