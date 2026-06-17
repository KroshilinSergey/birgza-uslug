const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  const db = {};
  
  const files = fs.readdirSync(__dirname);
  for (const file of files) {
    if (file !== 'index.js' && file.endsWith('.js')) {
      const model = require(path.join(__dirname, file))(sequelize);
      db[model.name] = model;
    }
  }
  
  db.sequelize = sequelize;
  return db;
};
