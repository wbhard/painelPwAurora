const net = require('net');

class GameDBClient {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.socket = null;
    this.connected = false;
    this.buffer = Buffer.alloc(0);
    this.pendingRequests = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();

      this.socket.connect(this.port, this.host, () => {
        this.connected = true;
        console.log(`✅ Conectado ao gamedbd em ${this.host}:${this.port}`);
        resolve();
      });

      this.socket.on('data', (data) => {
        this.buffer = Buffer.concat([this.buffer, data]);
        this._tryParseResponse();
      });

      this.socket.on('close', () => {
        console.log('🔌 Conexão encerrada');
        this.connected = false;
      });

      this.socket.on('error', (err) => {
        console.error('❌ Erro de socket:', err);
        reject(err);
      });
    });
  }

  _tryParseResponse() {
    while (this.buffer.length >= 10) {
      const opcode = this.buffer.readUInt16LE(0);
      const requestId = this.buffer.readUInt32LE(2);
      const retcode = this.buffer.readInt32LE(6);

      const handler = this.pendingRequests.get(requestId);
      if (!handler) return;

      if (retcode !== 0) {
        handler.reject(new Error(`Erro do servidor: código ${retcode}`));
        this.pendingRequests.delete(requestId);
        this.buffer = Buffer.alloc(0);
        return;
      }

      if (opcode === 0x0D49) { // RPC_GETUSERROLES
        if (this.buffer.length < 14) return;

        const count = this.buffer.readUInt32LE(10);
        let offset = 14;
        const roles = [];

        for (let i = 0; i < count; i++) {
          if (this.buffer.length < offset + 56) return; // 32 name, 4 id, 1+1+2+4+4+1+4

          const roleId = this.buffer.readUInt32LE(offset); offset += 4;
          const name = this.buffer.toString('utf8', offset, offset + 32).replace(/\0/g, ''); offset += 32;
          const classId = this.buffer.readUInt8(offset++); 
          const race = this.buffer.readUInt8(offset++);
          const level = this.buffer.readUInt16LE(offset); offset += 2;
          const mapId = this.buffer.readUInt32LE(offset); offset += 4;
          const created = this.buffer.readUInt32LE(offset); offset += 4;
          const deleted = this.buffer.readUInt8(offset++); 
          const custom = this.buffer.readUInt32LE(offset); offset += 4;

          roles.push({ roleId, name, classId, race, level, mapId, created, deleted, custom });
        }

        this.pendingRequests.delete(requestId);
        handler.resolve(roles);
        this.buffer = this.buffer.slice(offset);
        return;
      }

      handler.reject(new Error(`Opcode desconhecido: ${opcode}`));
      this.pendingRequests.delete(requestId);
      this.buffer = Buffer.alloc(0);
    }
  }

  getRoleList(userid, requestId = 1) {
    if (!this.connected) return Promise.reject(new Error('Não conectado ao gamedbd'));

    return new Promise((resolve, reject) => {
      const packet = Buffer.alloc(6 + 4);
      packet.writeUInt16LE(0x0D49, 0); // opcode
      packet.writeUInt32LE(requestId, 2);
      packet.writeUInt32LE(userid, 6); // aqui é o userID numérico, não o login

      this.pendingRequests.set(requestId, { resolve, reject });
      this.socket.write(packet);
    });
  }

  disconnect() {
    if (this.socket) this.socket.destroy();
    this.connected = false;
  }
}


function parseUserRolesResponse(buffer) {
  const roles = [];
  let offset = 0;

  const count = buffer.readUInt32LE(offset);
  offset += 4;

  for (let i = 0; i < count; i++) {
    const roleId = buffer.readUInt32LE(offset);
    offset += 4;

    const nameBuffer = buffer.slice(offset, offset + 32);
    const name = nameBuffer.toString('utf8').replace(/\0/g, '');
    offset += 32;

    const classId = buffer.readUInt8(offset++);
    const race = buffer.readUInt8(offset++);
    const level = buffer.readUInt16LE(offset);
    offset += 2;

    const mapId = buffer.readUInt32LE(offset);
    offset += 4;

    const timeCreated = buffer.readUInt32LE(offset);
    offset += 4;

    const deleteFlag = buffer.readUInt8(offset++);
    const customData = buffer.readUInt32LE(offset);
    offset += 4;

    roles.push({
      roleId,
      name,
      classId,
      race,
      level,
      mapId,
      timeCreated,
      deleteFlag,
      customData
    });
  }

  return roles;
}

module.exports = GameDBClient;
