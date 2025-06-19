export function parseUserRolesPayload(buffer) {
  const offset = { offset: 0 };

  // pular retcode (4 bytes) e 4 bytes de padding
  offset.offset += 8;

  const roles = [];
  const count = buffer[offset.offset];
  offset.offset += 1;

  for (let i = 0; i < count; i++) {
    const roleId = buffer.readUInt32BE(offset.offset);
    offset.offset += 4;

    
    //getRoleData(roleId);

    const nameLen = buffer[offset.offset];
    offset.offset += 1;

    const rawName = buffer.slice(offset.offset, offset.offset + nameLen);
    offset.offset += nameLen;

    const name = rawName.toString('utf16le').replace(/\0/g, '');

    roles.push({ roleId, name });
  }

  return roles;
}
