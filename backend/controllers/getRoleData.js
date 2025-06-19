import { Socket } from 'net';
import {
  packCUInt,
  unpackCUint
} from '../utils/gdbProtocol.js';
import { parseRoleData8003 } from '../utils/schemas/parserRoleData8003.js';

/**
 * Monta o payload de 8 bytes com -1 e roleid
 */
function buildGetRoleDataPayload(roleid) {
  const buffer = Buffer.alloc(8);
  buffer.writeInt32BE(-1, 0);       // -1 como no PHP (0xFFFFFFFF)
  buffer.writeUInt32BE(roleid, 4);  // roleid em big-endian
  return buffer;
}

/**
 * Cria o pacote completo com CUINT opcode + CUINT len + payload
 */
function createPacket(opcode, payload) {
  const opcodeCUInt = packCUInt(opcode);
  const lengthCUInt = packCUInt(payload.length);
  return Buffer.concat([opcodeCUInt, lengthCUInt, payload]);
}

/**
 * Aguarda e resolve o pacote completo recebido via socket
 */
function waitForPayload(socket) {
  return new Promise((resolve, reject) => {
    let bufferTotal = Buffer.alloc(0);
    let expectedLength = null;
    let payloadStart = null;

    socket.on('data', (chunk) => {
      bufferTotal = Buffer.concat([bufferTotal, chunk]);

      try {
        if (expectedLength === null && bufferTotal.length >= 2) {
          const offsetObj = { offset: 0 };
          unpackCUint(bufferTotal, offsetObj); // opcode
          expectedLength = unpackCUint(bufferTotal, offsetObj); // len
          payloadStart = offsetObj.offset; // onde começa o payload real
        }

        if (
          expectedLength !== null &&
          bufferTotal.length >= payloadStart + expectedLength
        ) {
          const offset = { offset: 0 };
          const opcode = unpackCUint(bufferTotal, offset);
          const len = unpackCUint(bufferTotal, offset);
          const payload = bufferTotal.slice(offset.offset, offset.offset + len);
          resolve({ opcode, payload });
        }
      } catch (err) {
        reject(err);
      }
    });

    socket.on('error', reject);
    socket.on('close', () => reject(new Error('Socket fechado antes da resposta')));
  });
}

/**
 * Função principal que conecta, envia e aguarda a resposta do getRoleData
 */
export function getRoleData(roleid) {
  //manual - utilizar o gamedb-client
  const OPCODE_GET_ROLE_DATA = 8003;
  const HOST = "192.168.0.105";
  const PORT = 29400;

  const socket = new Socket();

  return new Promise((resolve, reject) => {
    socket.connect(PORT, HOST, async () => {
      console.log('✅ Conectado - getRoleData (roleid =', roleid, ')');

      const payload = buildGetRoleDataPayload(roleid);
      const packet = createPacket(OPCODE_GET_ROLE_DATA, payload);
      socket.write(packet);
      console.log('📤 Pacote enviado (hex):', packet.toString('hex'));

      try {
        const { payload } = await waitForPayload(socket);
        console.log('📦 Payload (hex):', payload.toString('hex'));

        const retcode = payload.readInt32LE(0);
        if (retcode !== 0 && retcode !== -129) {
          console.log('📋 Personagem:', { error: 'retcode != 0', retcode });
          socket.destroy();
          return reject(retcode);
        }

        const parsed = parseRoleData8003(payload.subarray(4));
        console.log('📋 Personagem:', parsed);
        socket.destroy();
        resolve(parsed);

      } catch (err) {
        console.error('❌ Erro ao processar getRoleData:', err);
        socket.destroy();
        reject(err);
      }
    });

    socket.on('error', (err) => {
      console.error('❌ Erro na conexão getRoleData:', err);
      reject(err);
    });

    socket.on('close', () => {
      console.log('🔌 Conexão getRoleData encerrada.');
    });
  });
}
