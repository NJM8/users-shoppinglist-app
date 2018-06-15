// npm packages
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('cookie-session');
const flash = require('connect-flash');
const userRoutes = require('./routes/users');
const itemRoutes = require('./routes/items');

//globals
const PORT = process.env.PORT || 8080;
const app = express();

if (app.get('env') === 'development') { 
  require('dotenv').load(); 
}

// app configuration
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(morgan('tiny'));
app.use(session({secret: process.env.KEY}));
app.use(flash());

app.get('/', (req, res, next) => {
  return res.redirect('/users');
});

// send flash messages to all routes
app.use(function(req, res, next){
  res.locals.message = req.flash('message');
  next();
});

// get routes
app.use('/users', userRoutes);
app.use('/users/:user_id/items', itemRoutes);

// catch 404 and send to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  return next(err);
});

// error handler
app.use((err, req, res, next) => {
  let mode = app.get('env');
  if (mode === 'development') {
    console.log(err);
  }
  res.status(err.status || 500);
  return res.render('error', {
    message: err.message,
    // if in development mode print full stack trace
    error: mode === 'development' ? err : {}
  });
});

app.listen(PORT, () => {
  console.log(`App is being served on port ${PORT}`);
})
