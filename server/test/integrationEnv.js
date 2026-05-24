require('dotenv').config();

const testDbName =
  process.env.DB_NAME_TEST ||
  (process.env.DB_NAME ? `${process.env.DB_NAME}_test` : 'mern_todo_test');

process.env.DB_NAME = testDbName;

if (!/test/i.test(process.env.DB_NAME)) {
  throw new Error(
    `Refusing to run integration tests against non-test DB: ${process.env.DB_NAME}. ` +
      'Set DB_NAME_TEST to a database name containing "test".'
  );
}

module.exports = { testDbName };
