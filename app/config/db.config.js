// module.exports = {
//   HOST: "localhost",
//   USER: "root",
//   PASSWORD: "123456",
//   DB: "testdb",
//   dialect: "mysql",
//   pool: {
//     max: 5,
//     min: 0,
//     acquire: 30000,
//     idle: 10000
//   }
// };
module.exports = {
  HOST: "team-dev-uat-db.cckrz61nf7go.ap-east-1.rds.amazonaws.com",
  USER: "a4develop",
  PASSWORD: "pHGqDsHhdgfR2evBUYAKPNxWSSufxdb2",
  DB: "dev_a4lution_cowork",
  dialect: "mysql",
  port: 8083,
  // multipleStatements: true,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
