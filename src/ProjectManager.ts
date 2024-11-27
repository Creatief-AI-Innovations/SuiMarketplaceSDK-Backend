import { encrypt } from './utils/crypto.helper';
import Database from './utils/database';
import { createSUIWallet } from './utils/utils';

const args = process.argv.slice(2);
const projectName = args[0];

function generateApiKey(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let apiKey = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        apiKey += characters[randomIndex];
        if ( (i + 1) < length && (i + 1) % 7 === 0) {
            apiKey += "-";
        }
    }
    return apiKey;
}


async function createUser(name: string): Promise<string> {

    if (name && name.length > 0) {
        let createProject = "insert into projects set name = ?, apikey = ?, wallet = ?";
   
        const apiKey = generateApiKey(28);
        console.log('Generated API Key:', apiKey);
    
        let suiWallet = await createSUIWallet();
        let encryptedPkey = encrypt(suiWallet.private);
    
        let newProject = await Database.queryAndClose<{insertId : number}>(createProject, [name, apiKey, encryptedPkey]); 
        //console.log("project created with id ", newProject.insertId, 'wallet address = ', suiWallet.public);
        return new Promise<string>((resolve, reject) => { resolve(`New project is successfully created with wallet address ("${suiWallet.public}").\nUse the below info in sui market sdk. \n\tname\t:\t${name}\n\tapi-key\t:\t${apiKey}`) });
    } else {
       return new Promise<string>((resolve, reject) => { reject("you need to specify the name of the project.") });
    }
    
}


createUser(projectName).then(message => {
    console.log(message);
}).catch((error) => {
    console.error(error);
}).finally(()=>{
    process.exit(0);
});

//console.log("welcome");



