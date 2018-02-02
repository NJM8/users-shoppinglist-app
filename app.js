// npm packages
const express = require('express');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const session = require('cookie-session');
const flash = require('connect-flash');
const userRoutes = require('./routes/users');

//globals
const PORT = process.env.PORT || 8000;
const app = express();

if (app.get('env') === 'development') { 
  require('dotenv').load(); 
}

// app configuration
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(session({secret: process.env.KEY}));
app.use(flash());
app.use('/users', userRoutes);

app.get('/', (req, res, next) => {
  return res.redirect('/users');
});

app.use(function(req, res, next){
  res.locals.message = req.flash('message');
  next();
});
// catch 404 and send to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  return next(err);
});

// error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  return res.render('error', {
    message: err.message,
    // if in development mode print full stack trace
    error: app.get('env') === 'development' ? err : {}
  });
});

app.listen(8000, () => {
  console.log('App is being served on port 8000');
})
