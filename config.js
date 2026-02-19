const config = {
  jwtSecret: process.env.JWT_SECRET || "test-secret-key-kun-til-udvikling",
  saltRounds: parseInt(process.env.SALT_ROUNDS) || 10,
  tokenExpiry: process.env.TOKEN_EXPIRY || "1h",
};

module.exports = config;
