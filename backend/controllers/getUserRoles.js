import {Socket} from 'net';
import {
  packCUInt,
  unpackCUint,
  cuintSize,
  readType,
  unmarshal,
  unpackCUintWithMeta
} from '../utils/gdbProtocol.js';

import { parseUserRolesPayload } from '../utils/schemas/parserUserRolesPayload.js';

function buildGetUserPayload(userId) {
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32BE(0xFFFFFFFF, 0);
  buffer.writeUInt32BE(userId, 4);
  buffer.writeUInt32BE(1, 8);
  buffer.writeUInt32BE(1, 12);
  return buffer;
}

function createPacket(opcode, payload) {
  const opcodeCUInt = packCUInt(opcode);
  const lengthCUInt = packCUInt(payload.length);
  return Buffer.concat([opcodeCUInt, lengthCUInt, payload]);
}


export function getUserRolesSync(userId) {
  return new Promise((resolve, reject) => {
    const socket = new Socket();

    socket.connect(29400, "192.168.0.105", () => {
      const payload = buildGetUserPayload(userId);
      const packet = createPacket(3401, payload);
      socket.write(packet);
    });

    socket.on('data', (data) => {
      try {
        const offset = { offset: 0 };
        unpackCUint(data, offset); // opcode
        unpackCUint(data, offset); // length
        const payload = data.slice(offset.offset);

        if (payload.length === 0) {
          return resolve([]);
        }

        const parsed = parseUserRolesPayload(payload);
        resolve(parsed); // [{ id, name }, ...]
      } catch (err) {
        reject(err);
      } finally {
        socket.destroy();
      }
    });

    socket.on('error', reject);
    socket.on('close', () => console.log("🔌 Socket closed"));
  });
}

export default { getUserRolesSync };
