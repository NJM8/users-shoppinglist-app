const mongoose = require('mongoose');

mongoose.set('debug', true);
mongoose.Promise = global.Promise;

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost/users-shoppinglist-app')
  .then(() => {
    return console.log('Connected to MongoDB')
  })
  .catch(err => {
    console.log(`Error: ${err}`);
  });



exports.User = require('./user');
exports.Item = require('./item');