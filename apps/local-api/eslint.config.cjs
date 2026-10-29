const expo = require('../mobile/node_modules/eslint-config-expo/flat');
module.exports = [...expo, { ignores: ['**/dist/**'] }, { settings: { react: { version: '19.3.0' } } }];
