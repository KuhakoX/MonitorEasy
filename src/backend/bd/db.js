import mysql2 from 'mysql2';

const connection = mysql2.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'monitoreasy',
  port: 3306
});

connection.connect((err) => {

    if (err) {
        console.error('Erro ao realizar conexão com o BD:', err);
        throw err;
    }

    console.log('Conexão com o BD realizada com sucesso!');
});

export default connection;