import {
  unpackCUint,
  unpackCUintWithMeta
} from '../../utils/gdbProtocol.js';

export function parseRoleData8003(buffer) {
  const data = {
    base: {},
    forbid: {},
    status: {},
    pocket: {},
  };

  const offset = { value: 10 }; // após header fixo (0x7fffffff...)

  // Leitura do name (UTF-16LE até 0x0000)
  let name = '';
  while (true) {
    const charCode = buffer.readUInt16LE(offset.value);
    offset.value += 2;
    if (charCode === 0x0000) break;
    name += String.fromCharCode(charCode);
  }
  data.base.name = name;

  // ID logo antes do name
  //data.id = buffer.readUInt16BE(7);

  // Campos próximos ao nome
  let currentOffset = offset.value;
  data.base.race   = buffer.readUInt8(currentOffset);
  data.base.cls    = buffer.readUInt8(currentOffset += 5);//5
  data.base.gender = buffer.readUInt8(currentOffset += 1);//1

  
  currentOffset += 1; //pular byte fora de estrutura

  // custom_data
  const { value: custom_data_Len, bytesUsed } = unpackCUintWithMeta(buffer, currentOffset);
  currentOffset += bytesUsed;
  data.base.custom_data = buffer.slice(currentOffset, currentOffset + custom_data_Len).toString('hex');
  currentOffset += custom_data_Len;


const configOffset = { offset: currentOffset };
const configLength = unpackCUint(buffer, configOffset);
const configStart = configOffset.offset;
const configDataEnd = configStart + configLength;

data.base.config_data = buffer.slice(configStart, configDataEnd).toString('hex');
currentOffset = configDataEnd;



    
  data.base.custom_stamp =  buffer.readUInt32BE(currentOffset);

  data.base.status =  buffer.readUInt32BE(currentOffset += 1);

  data.base.delete_time =  buffer.readUInt32BE(currentOffset += 4); //ID1072 (1094)
  data.base.create_time =  buffer.readUInt32BE(currentOffset += 4); //ID1072 (1097)
  data.base.lastlogin_time =  buffer.readUInt32BE(currentOffset += 4); //ID1072 (1101)

  //forbid
  data.forbid.type =  buffer.readInt8(currentOffset += 5);
  data.forbid.time =  buffer.readInt16BE(currentOffset += 1);
  data.forbid.createtime = buffer.readUInt32BE(currentOffset += 4)
  //currentOffset += 4;

  // Reason (Octets)
const reasonOffset = { offset: currentOffset };
const reasonLength = unpackCUint(buffer, reasonOffset);
data.forbid.reason = buffer.slice(reasonOffset.offset, reasonOffset.offset + reasonLength).toString('hex');
currentOffset = reasonOffset.offset + reasonLength;
/*
// Help_states (Octets)
{
  const { value: helpStatesLength, bytesUsed } = unpackCUintWithMeta(buffer, currentOffset);
  currentOffset += bytesUsed;
  data.base.help_states = buffer.slice(currentOffset, currentOffset + helpStatesLength).toString('hex');
  currentOffset += helpStatesLength;
}
// Spouse (int)
data.base.spouse = buffer.readUInt32BE(currentOffset);
currentOffset += 4;

// UserID (int)
data.base.userid = buffer.readUInt32BE(currentOffset +=1);
currentOffset += 4;

// Cross_data (Octets)
{
const { value: crossDataLength, bytesUsed } = unpackCUintWithMeta(buffer, currentOffset);
currentOffset += bytesUsed;
data.base.cross_data = buffer.slice(currentOffset, currentOffset + crossDataLength).toString('hex');
currentOffset += crossDataLength;
}

// hd_custom_data (Octets)
{
const { value: hdCustomLength, bytesUsed } = unpackCUintWithMeta(buffer, currentOffset);
currentOffset += bytesUsed;
data.base.hd_custom_data = buffer.slice(currentOffset, currentOffset + hdCustomLength).toString('hex');
currentOffset += hdCustomLength;
}
//<status>
data.status.version = buffer.readInt8(currentOffset += 2);

data.status.nivel = buffer.readUInt32BE(currentOffset +=1);

data.status.cultivo = buffer.readUInt32BE(currentOffset +=4);

data.status.exp = buffer.readUInt32BE(currentOffset +=4);

data.status.espirito = buffer.readUInt32BE(currentOffset +=4);

data.status.pontosH = buffer.readUInt32BE(currentOffset +=4);

data.status.hp = buffer.readUInt32BE(currentOffset +=4);

data.status.mp = buffer.readUInt32BE(currentOffset +=4);

data.status.posx = buffer.readFloatBE(currentOffset +=4);

data.status.posy = buffer.readFloatBE(currentOffset +=4);

data.status.posz = buffer.readFloatBE(currentOffset +=4);

data.status.worldtag = buffer.readUInt32BE(currentOffset +=4);

data.status.invader_state = buffer.readUInt32BE(currentOffset +=4);

data.status.invader_time = buffer.readUInt32BE(currentOffset +=4);

data.status.pariah_time = buffer.readUInt32BE(currentOffset +=4);

data.status.reputation = buffer.readUInt32BE(currentOffset +=4);

currentOffset +=2;

//Octets: custom_status
if (buffer.readUInt8(currentOffset) === 0x04) {
  const csOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, csOffset);
  //console.log("len custom_status: ",len)
  data.status.custom_status = buffer.slice(csOffset.offset, csOffset.offset + len).toString('hex');
  currentOffset = csOffset.offset + len;
} else {
  // Assume 4 bytes fixos
  data.status.custom_status = buffer.slice(currentOffset, currentOffset).toString('hex');
  currentOffset +=4;
}

//Octets: filter_data
if (buffer.readUInt8(currentOffset) === 0x04) {
  // Tem cabeçalho CUInt (04) → valor de 4 bytes após o 1º
  const filterOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, filterOffset);
  data.status.filter_data = buffer.slice(filterOffset.offset, filterOffset.offset + len).toString('hex');
  currentOffset = filterOffset.offset + len;
} else {
  // Assume 4 bytes fixos
  data.status.filter_data = buffer.slice(currentOffset, currentOffset += 4).toString('hex');
}

//Octets: charactermode
data.status.charactermode = buffer.slice(currentOffset, currentOffset).toString('hex');
currentOffset +=1;

//Octets: instancekeylist
{
  const startCUInt = currentOffset;

  const offsetRef = { offset: currentOffset };
  const len = unpackCUint(buffer, offsetRef);

  const cuintSize = offsetRef.offset - startCUInt;
  const contentStart = offsetRef.offset;
  const contentEnd = contentStart + len;

  data.status.instancekeylist = buffer.slice(contentStart, contentEnd).toString('hex');
  currentOffset = contentEnd;
}

data.status.dbltime_expire = buffer.readUInt32BE(currentOffset);

data.status.dbltime_mode = buffer.readInt32BE(currentOffset +=4);

data.status.dbltime_begin = buffer.readInt32BE(currentOffset +=4);

data.status.dbltime_used = buffer.readInt32BE(currentOffset +=4);

data.status.dbltime_max = buffer.readInt32BE(currentOffset +=4);

data.status.time_used = buffer.readInt32BE(currentOffset +=4);

currentOffset += 4;

{
  const dbltimeOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, dbltimeOffset);
  data.status.dbltimedata = buffer.slice(dbltimeOffset.offset, dbltimeOffset.offset + len).toString('hex');
  currentOffset = dbltimeOffset.offset + len;
}

data.status.storesize = buffer.readInt16BE(currentOffset);

// Octets: petcorral
{
  const petcorralOffset = { offset: currentOffset +=2 };
  const len = unpackCUint(buffer, petcorralOffset);
  data.status.petcorral = buffer.slice(petcorralOffset.offset, petcorralOffset.offset + len).toString('hex');
  currentOffset = petcorralOffset.offset + len;
}

// Octets: property
{
  const propertyOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, propertyOffset);
  data.status.property = buffer.slice(propertyOffset.offset, propertyOffset.offset + len).toString('hex');
  currentOffset = propertyOffset.offset + len;
}

// Octets: var_data
{
  const varOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, varOffset);
  data.status.var_data = buffer.slice(varOffset.offset, varOffset.offset + len).toString('hex');
  currentOffset = varOffset.offset + len;
}

// Octets: skills
{
  const skillsOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, skillsOffset);
  data.status.skills = buffer.slice(skillsOffset.offset, skillsOffset.offset + len).toString('hex');
  currentOffset = skillsOffset.offset + len;
}

// Octets: storehousepasswd
{
  const passwdOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, passwdOffset);
  data.status.storehousepasswd = buffer.slice(passwdOffset.offset, passwdOffset.offset + len).toString('hex');
  currentOffset = passwdOffset.offset + len;
}

// Octets: waypointlist
{
  const waypointOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, waypointOffset);
  currentOffset +=1; //pular o buffer do offset
  data.status.waypointlist = buffer.slice(currentOffset, currentOffset + len).toString('hex');
  currentOffset = waypointOffset.offset + len;
}

// Octets: coolingtime
{
  const coolingtimeOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, coolingtimeOffset);
  currentOffset +=1; //pular o buffer do offset
  data.status.coolingtime = buffer.slice(currentOffset, currentOffset + len).toString('hex');
  currentOffset = coolingtimeOffset.offset + len;
}

// Octets: npc_relation
{
  const npcOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, npcOffset);
  data.status.npc_relation = buffer.slice(npcOffset.offset, npcOffset.offset + len).toString('hex');
  currentOffset = npcOffset.offset + len;
}

// Octets: multi_exp_ctrl
{
  const multiOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, multiOffset);
  data.status.multi_exp_ctrl = buffer.slice(multiOffset.offset, multiOffset.offset + len).toString('hex');
  currentOffset = multiOffset.offset + len;
}

// Octets: storage_task
{
  const stOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, stOffset);
  data.status.storage_task = buffer.slice(stOffset.offset, stOffset.offset + len).toString('hex');
  currentOffset = stOffset.offset + len;
}

// Octets: faction_contrib
{
  const fcOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, fcOffset);
  data.status.faction_contrib = buffer.slice(fcOffset.offset, fcOffset.offset + len).toString('hex');
  currentOffset = fcOffset.offset + len;
}

// Octets: force_data
{
  const forceOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, forceOffset);
  data.status.force_data = buffer.slice(forceOffset.offset, forceOffset.offset + len).toString('hex');
  currentOffset = forceOffset.offset + len;
}

// 🕐 Octets: online_award
{
  const oaOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, oaOffset);
  data.status.online_award = buffer.slice(oaOffset.offset, oaOffset.offset + len).toString('hex');
  currentOffset = oaOffset.offset + len;
}

// Octets: profit_time_data
{
  const profitOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, profitOffset);
  data.status.profit_time_data = buffer.slice(profitOffset.offset, profitOffset.offset + len).toString('hex');
  currentOffset = profitOffset.offset + len;
}

// Octets: country_data
{
  const countryOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, countryOffset);
  data.status.country_data = buffer.slice(countryOffset.offset, countryOffset.offset + len).toString('hex');
  currentOffset = countryOffset.offset + len;
}

// Octets: king_data
{
  const kingOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, kingOffset);
  data.status.king_data = buffer.slice(kingOffset.offset, kingOffset.offset + len).toString('hex');
  currentOffset = kingOffset.offset + len;
}

// Octets: meridian_data
{
  const meridianOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, meridianOffset);
  data.status.meridian_data = buffer.slice(meridianOffset.offset, meridianOffset.offset + len).toString('hex');
  currentOffset = meridianOffset.offset + len;
}

// Octets: extraprop
{
  const extraOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, extraOffset);
  data.status.extraprop = buffer.slice(extraOffset.offset, extraOffset.offset + len).toString('hex');
  currentOffset = extraOffset.offset + len;
}

// Octets: title_data
{
  const titleOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, titleOffset);
  data.status.title_data = buffer.slice(titleOffset.offset, titleOffset.offset + len).toString('hex');
  currentOffset = titleOffset.offset + len;
}


// Octets: reincarnation_data
{
  const reinOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, reinOffset);
  data.status.reincarnation_data = buffer.slice(reinOffset.offset, reinOffset.offset + len).toString('hex');
  currentOffset = reinOffset.offset + len;
}

// Octets: realm_data
{
  const realmOffset = { offset: currentOffset };
  const len = unpackCUint(buffer, realmOffset);
  data.status.realm_data = buffer.slice(realmOffset.offset, realmOffset.offset + len).toString('hex');
  currentOffset = realmOffset.offset + len;
}

data.pocket.capacity = buffer.readInt32BE(currentOffset +=2);

data.pocket.timestamp = buffer.readInt32BE(currentOffset +=4);

data.pocket.money = buffer.readInt32BE(currentOffset +=4);


//continuar aqui teria que fazer um laço de itens do inventario*/

return data;

}
