import connection from '../backend/bd/db.js';

export function read(callback) {
    connection.query('SELECT * FROM usuarios', callback);

}
export function create(nome, email, senha, callback) {
    const sql = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
    connection.query(sql, [nome, email, senha], callback);
}
export function update(id, nome, email, senha, callback) {
    const sql = 'UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?';
    connection.query(sql, [nome, email, senha, id], callback);
}
export function deleteUsuario(id, callback) {
    const sql = 'DELETE FROM usuarios WHERE id = ?';
    connection.query(sql, [id], callback);
}  