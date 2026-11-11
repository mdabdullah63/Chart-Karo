const passport = require("passport");

require("./strategies/google.strategy");
require("./strategies/github.strategy");
require("./strategies/facebook.strategy");

module.exports = passport;
