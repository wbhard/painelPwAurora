//import { getUser } from './controllers/getUser';
//const { getUserRolesSync } = require('./controllers/getUserRoles');
//import { parseUserPayload } from './utils/schemas/parserUser';
import  {getRoleData} from './controllers/getRoleData.js';


//getUser(1024) //dados da conta em geral (gold)
//getUserRolesSync(1024); // ou o ID da conta que você quer testar
const roleid = 1072;
getRoleData(roleid)
  .then(data => {
    //console.log('✅ Dados recebidos:', data);
  })
  .catch(err => {
    console.error('❌ Falha ao buscar personagem:', err);
  });
//*/