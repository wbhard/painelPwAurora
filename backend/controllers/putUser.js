import { Socket } from 'net';
import { packCUInt } from '../utils/gdbProtocol.js'; // já usamos nos outros comandos
import crypto from 'crypto';

// Funções de hash
function gerarHashSHA1Base64(password) {
  return crypto.createHash('sha1').update(password).digest('base64');
}

function gerarHashMD5HexUsernamePassword(username, password) {
  return '0x' + crypto.createHash('md5').update(username + password).digest('hex');
}

// Monta o payload do PutUser
function buildPutUserPayload(account) {
  const {
    name,
    password,
    truename = '',
    email = '',
    prompt = '',
    answer = '',
  } = account;

  const passwd = gerarHashSHA1Base64(password);
  const passwd2 = gerarHashMD5HexUsernamePassword(name, password);

  const now = Math.floor(Date.now() / 1000);

  // campos baseados no projeto PHP
  const fields = [
    ['name', name],
    ['passwd', passwd],
    ['passwd2', passwd2],
    ['truename', truename],
    ['email', email],
    ['prompt', parseInt(prompt)],
    ['answer', answer],
    ['gender', 0],
    ['birthday', 0],
    ['creatime', now],
  ];

  const encodeString = (str) => {
    const buf = Buffer.from(str, 'utf8');
    return Buffer.concat([packCUInt(buf.length), buf]);
  };

  const encodeInt = (num) => {
    const buf = Buffer.alloc(4);
    buf.writeInt32LE(num, 0);
    return buf;
  };

  const valueBuffers = fields.map(([key, val]) => {
    const keyBuf = encodeString(key);
    const valBuf = typeof val === 'number' ? encodeInt(val) : encodeString(val);
    return Buffer.concat([keyBuf, valBuf]);
  });

  const valueMap = Buffer.concat([packCUInt(fields.length), ...valueBuffers]);
  const keyBuf = encodeString(name); // usado como "key" no UserPair

  return Buffer.concat([keyBuf, valueMap]);
}



// Envia o pacote PutUser (opcode 3001)
export async function putUser(account) {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    const OPCODE_PUTUSER = 0x0BB9; // 3001

    socket.connect(29400, '192.168.0.105', () => {
      console.log('🟢 Conectado ao gamedbd');

      const payload = buildPutUserPayload(account);
      const packet = Buffer.concat([
        packCUInt(OPCODE_PUTUSER),
        packCUInt(payload.length),
        payload,
      ]);
      console.log('📦 Tamanho do payload real:', payload.length);
      console.log('📤 Enviando pacote (hex):', packet.toString('hex'));
      socket.write(packet);
    });

    socket.on('data', (data) => {
      const retcode = data.at(-1); // último byte geralmente é o retcode
      console.log('📥 Resposta recebida. Retcode:', retcode);
      socket.destroy();
      resolve(retcode);
    });

    socket.on('error', (err) => {
      console.error('❌ Erro ao conectar ao gamedbd:', err);
      reject(err);
    });
    
    socket.on('close', () => {
    console.log('🔌 Conexão encerrada pelo servidor');
    });

  });
}
