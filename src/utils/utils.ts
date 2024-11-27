import { NextFunction, Request, Response } from 'express';
import Database from './database';
import { Project } from '../models/project.model';
import bcrypt from "bcryptjs";
import { error } from 'console';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { verifyJWT } from './JwtHelper';

export const formatJSONResponse = (response: Record<string, unknown>) => {
    return {
        statusCode: 200,
        body: JSON.stringify(response)
    }
}


export const verifyApi = function (
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const apiKey = req.header('x-api-key');
    console.log(`apiKey : ${apiKey}  `);

    if (apiKey) {

        const project_query = `SELECT * FROM projects WHERE apikey = '${apiKey}'`;
        Database.queryAndClose<Project[]>(project_query).then((results) => {
            if (results.length > 0) {
                // @ts-ignore
                req.project = results[0];
                return next();
            } else {
                res.status(401).json({ message: 'Authentication Error' });
            }
        }).catch((error) => {
            res.status(401).json({ message: 'Authentication Error' });
        })

        // next();
    } else {
        res.status(401).json({ message: 'Authentication Error' });
    }

};


export const verifyUser = function (
    req: Request,
    res: Response,
    next: NextFunction,
) {

    let token = req.header('Authorization');

    if (token) {
        token = token.replace("Bearer ", "");
        try {

            const decoded: any = verifyJWT(token);
            if (decoded) {
                const user_query = `SELECT * FROM users WHERE id = '${decoded.id}'`;
                Database.queryAndClose<Project[]>(user_query).then((results) => {
                    if (results.length > 0) {
                        // @ts-ignore
                        req.user = results[0];
                        return next();
                    } else {
                        res.status(401).json({ message: 'user not found' });
                    }
                }).catch((error) => {
                    res.status(401).json({ message: 'user error' });
                })
            }
        } catch (e) {
            console.error('Authentication error', e);
            res.status(401).json({ message: 'Authentication Error' });
        }


    } else {
        res.status(401).json({ message: 'user authentication error' });
    }

};




// console.log(`Results : `, results);



export const hashedPassword = async (password: string) => {//NOTE: 'bcrypt' package doesn't work on lambda. So using 'bcryptjs'.
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}

export const comparePassword = async (password: string, hash: string) => {
    const result = await bcrypt.compare(password, hash);
    return result;
}


export async function createSUIWallet() {
    // Create SUI Keypair
    const keypair = new Ed25519Keypair();
    const pubKey = keypair.getPublicKey().toSuiAddress();
    const pvtKey = keypair.getSecretKey();
    return { public: pubKey, private: pvtKey };
}