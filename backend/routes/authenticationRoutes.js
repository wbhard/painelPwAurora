import express from 'express';
import db from '../db.js';
import crypto from 'crypto';

const router = express.Router();


// Funções auxiliares de hash
function gerarHashSHA1Base64(password) {
  return crypto.createHash('sha1').update(password).digest('base64');
}

function gerarHashMD5Hex(password) {
  return '0x' + crypto.createHash('md5').update(password).digest('hex');
}

function gerarHashMD5Base64UsernamePassword(username, password) {
  return crypto.createHash('md5').update(username + password).digest('base64');
}

function gerarHashMD5HexUsernamePassword(username, password) {
  return '0x' + crypto.createHash('md5').update(username + password).digest('hex');
}



// Processa o login
router.post('/login', async (req, res) => {
  const { name, password } = req.body;
  try {
    console.log('Tentativa de login:', name);
    const [users] = await db.query('SELECT * FROM users WHERE name = ?', [name]);
    if (users.length === 0) {
      return res.redirect('/login?error=Usuário não encontrado');
    }

    const user = users[0];
    const hashSHA1 = gerarHashSHA1Base64(password);
    const hashMD5Hex = gerarHashMD5Hex(password);
    const hashMD5Base64 = gerarHashMD5Base64UsernamePassword(name, password);
    const hashMD5HexUserPass = gerarHashMD5HexUsernamePassword(name, password);

    const senhaCorreta = 
      (user.passwd === hashMD5Base64) ||
      (user.passwd2 && user.passwd2.toLowerCase() === hashMD5HexUserPass.toLowerCase()) ||
      (user.passwd === hashSHA1) ||
      (user.passwd2 && user.passwd2.toLowerCase() === hashMD5Hex.toLowerCase());

    if (!senhaCorreta) {
      return res.redirect('/login?error=Senha incorreta');
    }

    req.session.userId = user.ID;
    req.session.userName = user.name;
    console.log('Login bem-sucedido:', user.ID);
    res.redirect('/painel-home');
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).send('Erro no login');
    //console.log('Login bem-sucedido: Error', name);
    //res.redirect('/painel-home');
  }
});

//Login
router.get('/login', (req, res) => {
  const error = req.query.error;
  res.render('login', { error });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

//Renderiza a pagina de cadastro
router.get('/register', (req, res) => {
  res.render('register', { mensagem: req.query.mensagem || null });
});


import { putUser } from '../controllers/putUser.js';

router.post('/register', async (req, res) => {
  const { truename, name, email, password, confirmPassword, prompt, answer } = req.body;

  if (!name || !password || !confirmPassword || !email || !truename || !prompt || !answer) {
    return res.redirect('/register?mensagem=Preencha todos os campos');
  }

  if (password !== confirmPassword) {
    return res.redirect('/register?mensagem=Senhas não conferem');
  }

  try {
    // Verifica se já existe usuário com o mesmo login no banco
    const [existingUsers] = await db.query('SELECT ID FROM users WHERE name = ?', [name]);
    if (existingUsers.length > 0) {
      return res.redirect('/register?mensagem=Login já existente');
    }

    // Dados para envio via PutUser (opcode 3001)
    const account = {
      name,
      password,
      truename,
      email,
      prompt,
      answer
    };

    const retcode = await putUser(account);

    if (retcode === 0) {
      return res.redirect('/login?mensagem=Conta criada com sucesso!');
    } else {
      return res.redirect(`/register?mensagem=Erro ao criar conta (retcode ${retcode})`);
    }

  } catch (error) {
    console.error('Erro no registro via RPC:', error);
    return res.redirect('/register?mensagem=Erro inesperado ao criar conta');
  }
});



export default router;

