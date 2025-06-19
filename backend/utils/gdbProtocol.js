export function packCUInt(value) {
  if (value < 0x40) return Buffer.from([value]);
  else if (value < 0x4000) {
    const buf = Buffer.alloc(2);
    buf.writeUInt16BE(value | 0x8000, 0);
    return buf;
  } else if (value < 0x20000000) {
    const buf = Buffer.alloc(4);
    buf.writeUInt32BE(value | 0xC0000000, 0);
    return buf;
  } else {
    const buf = Buffer.alloc(5);
    buf[0] = 0xE0;
    buf.writeUInt32LE(value, 1);
    return buf;
  }
}

export function unpackCUint(buffer, offsetRef) {
  const start = offsetRef.offset;
  const first = buffer.readUInt8(start);

  if ((first & 0x80) === 0) {
    offsetRef.offset += 1;
    return first;
  }

  if ((first & 0xC0) === 0x80) {
    const value = ((first & 0x3F) << 8) | buffer.readUInt8(start + 1);
    offsetRef.offset += 2;
    return value;
  }

  if ((first & 0xE0) === 0xC0) {
    const value = ((first & 0x1F) << 24) |
      (buffer.readUInt8(start + 1) << 16) |
      (buffer.readUInt8(start + 2) << 8) |
      buffer.readUInt8(start + 3);
    offsetRef.offset += 4;
    return value;
  }

  if ((first & 0xF0) === 0xE0) {
    const value = buffer.readUInt32LE(start + 1);
    offsetRef.offset += 5;
    return value;
  }

  throw new Error(`Invalid CUINT format at offset ${start}`);
}

export function unpackString(buffer, offsetRef) {
  const length = unpackCUint(buffer, offsetRef);
  const start = offsetRef.offset;
  const end = start + length;
  const str = buffer.slice(start, end).toString('utf8');
  offsetRef.offset = end;
  return str;
}

export function cuintSize(value) {
  if (value < 0x40) return 1;
  if (value < 0x4000) return 2;
  if (value < 0x20000000) return 4;
  return 5;
}

export function readType(buffer, offsetRef, type) {
  switch (type) {
    case 'byte':
      return buffer.readUInt8(offsetRef.offset++);
    case 'short':
      const s = buffer.readInt16BE(offsetRef.offset);
      offsetRef.offset += 2;
      return s;
    case 'int':
      const i = buffer.readInt32BE(offsetRef.offset);
      offsetRef.offset += 4;
      return i;
    case 'float':
      const f = buffer.readFloatBE(offsetRef.offset);
      offsetRef.offset += 4;
      return f;
    case 'lint':
      const l = buffer.readBigInt64BE(offsetRef.offset);
      offsetRef.offset += 8;
      return l;
    case 'cuint':
      return unpackCUint(buffer, offsetRef);
    case 'name':
      return unpackString(buffer, offsetRef);
    case 'octets':
      const len = unpackCUint(buffer, offsetRef);
      const oct = buffer.slice(offsetRef.offset, offsetRef.offset + len);
      offsetRef.offset += len;
      return oct;
    default:
      throw new Error('Tipo desconhecido: ');
  }
}

export function unmarshal(buffer, schema) {
  const offset = { offset: 0 };
  const result = {};

  for (const key in schema) {
    const type = schema[key];
    result[key] = readType(buffer, offset, type);
  }

  return result;
}

export function unpackCUintWithMeta(buffer, offset) {
  const firstByte = buffer[offset];
  if (firstByte < 0x80) {
    return { value: firstByte, bytesUsed: 1 };
  } else if (firstByte < 0xC0) {
    const val = ((firstByte & 0x3F) << 8) | buffer[offset + 1];
    return { value: val, bytesUsed: 2 };
  } else if (firstByte < 0xE0) {
    const val = ((firstByte & 0x1F) << 24) |
                (buffer[offset + 1] << 16) |
                (buffer[offset + 2] << 8) |
                buffer[offset + 3];
    return { value: val, bytesUsed: 4 };
  } else {
    const val = buffer.readUInt32LE(offset + 1);
    return { value: val, bytesUsed: 5 };
  }
}


export default {
  packCUInt,
  unpackCUint,
  cuintSize,
  readType,
  unmarshal,
  unpackCUintWithMeta
};