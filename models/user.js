const mongoose = require('mongoose');
var bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
  type: String,
  required: true,
  unique: true
  }, 
  password: {
    type: String,
    required: true
  }
  list: [{
    type: mongoose.Schema.Types.ObjectID,
    ref: 'Item'
  }]
}, 
  {timestamps: true}
);

userSchema.pre('save', function(next){
  var user = this;
  if (!user.isModified('password')) {
    return next();
  }
  bcrypt.hash(user.password, 10).then(function(hashedPassword){
    user.password = hashedPassword;
    next();
  }, function(err){
    return next(err);
  })
});

userSchema.methods.comparePassword = function(candidatePassword, next){
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch){
    if (err) {
      return next(err);
    }
    next(null, isMatch);
  });
};

module.exports = mongoose.Model('User', userSchema);