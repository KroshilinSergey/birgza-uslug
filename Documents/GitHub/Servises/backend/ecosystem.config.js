module.exports = {
  apps: [{
    name: 'bizha',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      JWT_SECRET: 'remont_expert_secret_key_2026_very_strong_password_12345'
    }
  }]
};
