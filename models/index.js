const mongoose = require("mongoose");

mongoose.set("debug", true);
mongoose.set("useUnifiedTopology", true);
mongoose.Promise = global.Promise;

mongoose
  .connect(process.env.DB_URI || "mongodb://localhost/users-shoppinglist-app", {
    useNewUrlParser: true,
  })
  .then(() => {
    return console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log(`Error: ${err}`);
  });

module.exports.User = require("./user");
module.exports.Item = require("./item");
