require('dotenv').config();

process.env.DB_NAME =
  process.env.DB_NAME_TEST ||
  (process.env.DB_NAME ? `${process.env.DB_NAME}_test` : 'mern_todo_test');

if (!/test/i.test(process.env.DB_NAME)) {
  console.error(
    `Refusing to migrate non-test database: ${process.env.DB_NAME}. ` +
      'Set DB_NAME_TEST to a name containing "test".'
  );
  process.exit(1);
}

require('./migrate.js');
