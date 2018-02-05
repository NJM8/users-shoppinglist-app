exports.loginRequired = function(req, res, next){
  if (req.session.user_id) {
    req.flash('message', `Welcome back ${req.session.username}, please log in.`);
    return res.redirect('/users/login');
  } else {
    next();
  }
};

exports.ensureCorrectUser = function(req, res, next){
  if (req.session.user_id !== req.params.user_id) {
    req.flash('error', 'Unauthorized!');
    return res.redirect('/users');
  } else {
    next();
  }
}

exports.verifyAdmin = function(req, res, next){
  if (req.body.isAdmin === 'true' && !req.body.adminPassword) {
    let tempUser = req.body;
    return res.render('verifyAdmin', { tempUser });
  } else {
    next();
  }
}