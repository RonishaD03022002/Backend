const sql = require('mssql');

const config = {
    user: 'cloudwebshop',
    password: 'Iren219@#',
    server: 'webshopdata.database.windows.net',
    database: 'cloudwebshop',
    options: {
        encrypt: true, // Use encryption
        enableArithAbort: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => {
        console.log('Database Connection Failed! Bad Config: ', err);
        throw err;
    });

module.exports = {
    sql, poolPromise
};
