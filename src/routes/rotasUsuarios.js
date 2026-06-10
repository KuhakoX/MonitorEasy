const express = require('express');
const app = express();
const cors = require('cors');
const connection = requires('../backend/bd/db');
const { getAllUsuarios, createUsuario, updateUsuario, deleteUsuario } = require('../controller/usuarioController.js');

app.use(express.json());
app.use(cors());

app.get('/usuarios', getAllUsuarios);
app.post('/usuarios', createUsuario);
app.put('/usuarios/:id', updateUsuario);
app.delete('/usuarios/:id', deleteUsuario);

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});