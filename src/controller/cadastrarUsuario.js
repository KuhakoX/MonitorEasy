import { create, read, updade, deleteUsuario } from '../models/usuarioModel.js';

// Função para criar um novo usuário
export async function createUsuario(req, res) {
    const { nome, email, senha } = req.body;
    console.log('Dados recebidos para criação de usuário:', { nome, email, senha });

    create(nome, email, senha, (err, result) => {
        if (err) {
            console.error('Erro ao criar usuário:', err);
            return res.status(500).json({ error: 'Erro ao criar usuário' });
        }
        console.log('Usuário criado com sucesso:', result);
        res.status(201).json({ message: 'Usuário criado com sucesso' });
    });
}

// Função para obter todos os usuários
export async function getAllUsuarios(req, res) {
    read((err, results) => {
        if (err) {
            console.error('Erro ao obter usuários:', err);
            return res.status(500).json({ error: 'Erro ao obter usuários' });
        }
        console.log('Usuários obtidos com sucesso:', results);
        res.status(200).json(results);
    });
}

// Função para atualizar um usuário existente
export async function updateUsuario(req, res) {
    const { id } = req.params;
    const { nome, email, senha } = req.body;
    console.log('Dados recebidos para atualização de usuário:', { id, nome, email, senha });
    update(id, nome, email, senha, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar usuário:', err);
            return res.status(500).json({ error: 'Erro ao atualizar usuário' });
        }
        console.log('Usuário atualizado com sucesso:', result);
        res.status(200).json({ message: 'Usuário atualizado com sucesso' });
    });
}

// Função para deletar um usuário existente
export async function deleteUsuario(req, res) {
    const { id } = req.params;
    deleteUsuario(id, (err, result) => {
        if (err) {
            console.error('Erro ao deletar usuário:', err);
            return res.status(500).json({ error: 'Erro ao deletar usuário' });
        }
        console.log('Usuário deletado com sucesso:', result);
        res.status(200).json({ message: 'Usuário deletado com sucesso' });
    });
}
