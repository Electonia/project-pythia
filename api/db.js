import sql from "mssql";

const config = {
  user: "pythia",
  password: "vNum%zP5Hp~0i0uq",
  server: "64.20.37.138", // SQL Server IP
  database: "DBproject_pythia",
  options: {
    encrypt: false, 
    trustServerCertificate: true
  }
};

const pool = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("Connected to SQL Server");
    return pool;
  })
  .catch(err => {
    console.error("Database Connection Failed!", err);
  });

export { sql, pool };