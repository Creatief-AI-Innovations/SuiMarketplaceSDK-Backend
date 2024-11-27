import express, { Request, Response } from 'express';
import { comparePassword, createSUIWallet, hashedPassword, verifyApi, verifyUser } from '../../utils/utils';
import { Project } from '../../models/project.model';
import Database from '../../utils/database';
import { User } from '../../models/user';
import { createJWTToken } from '../../utils/JwtHelper';
import { decrypt, encrypt } from '../../utils/crypto.helper';
import { SuiTradingClient } from '@tradeport/sui-trading-sdk';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fetchListOfProductsOwnedByWallet } from '../../utils/TradePortManager';


export const userRouteV1 = express.Router();

userRouteV1.post("/login", verifyApi,  async (req: Request, res: Response) => {
    let body = req.body;
    // console.log("request body", body);
    let userName = body.username;
    let password = body.password;
    // @ts-ignore
    let project = req.project as Project;

    let user : User;
    
    const query_user = `SELECT * from users where username = ? and pid=?`;
    let users = await Database.queryAndClose<User[]>(query_user, [userName, project.id]);  // and password = ?
    if (users && users.length > 0) {
        user = users[0];
        let hashedPwd = user.password;
        const passwordMatches = await comparePassword(password, hashedPwd);
        if (passwordMatches) {
            // @ts-ignore
            delete user['password'];

        } else {
            console.log(`Password doesn't match`);
            res.status(401).json({ message: "Incorrect username or password" });
        }

    } else {
        console.log("user doesn't exists. create a new user");
        let hashed_password = await hashedPassword(password);
        // console.log("password = ", password);
        // console.log("hashed password = ", hashed_password);

        let suiWallet = await createSUIWallet();
        let encryptedPkey = encrypt(suiWallet.private);
        // console.log("descypted pkey = ", decrypt(encryptedPkey));
        // console.log("original  pkey = ", suiWallet.private);
        let createUserQuery = "insert into users set username = ?, password = ?, wallet = ?, pkey = ?, pid = ?";

        let newUser = await Database.queryAndClose<{insertId : number}>(createUserQuery, [userName, hashed_password, suiWallet.public, encryptedPkey, project.id]); 
        console.log("user created with id ", newUser.insertId);
        user = {
            id : newUser.insertId,
            username : userName,
            password : '',
            wallet: suiWallet.public,
            pkey : '',
            pid : project.id
        }
    
       
    }

    let token = await createJWTToken(user.id);
 
    res.status(200).json({
        success: true, 
        token,
        message: 'User logged in successfully!', 
        data: {
            username: user.username,
            wallet : user.wallet,
        }
    });


});



/**
 * List a provided product for sale in the marketplace
 */
userRouteV1.get("/user/product/owned", verifyApi, verifyUser, async (req: Request, res: Response) => {

    // @ts-ignore
    let user = req.user as User;

    if (user) {
        const suiTradingClient = new SuiTradingClient({
            apiKey: process.env.TRADEPORT_KEY!,
            apiUser: process.env.TRADEPORT_USER!
        });


        const decoded_privateKey = decrypt(user.pkey);
        // console.log("decoded pkey =", decoded_privateKey);
        const keypair = Ed25519Keypair.fromSecretKey(decoded_privateKey);

        let suiWalletAddress = keypair.getPublicKey().toSuiAddress();
        console.log("public key from keypair === ", suiWalletAddress);


        try {

            const products = await fetchListOfProductsOwnedByWallet(suiWalletAddress, 0, 40);
            console.log("Owned items = ", products);

            const ownedNfts = products?.data?.sui?.nfts;

            if (ownedNfts) {

                let ownedProducts : {} = [];
                try {
                    ownedProducts = ownedNfts.map((product : any)=>{
                      return  {
                        id : product.id,
                        name : product.name,
                        media_url : product.media_url,
                        price : product.price,
                        price_str : product.price_str,
                        attributes : product.attributes,
                        owned : true,
                        listings : product.listings
                      }
                    })
                  } catch (error) {
                    console.log(error);
                  }

                res
                .status(200)
                .json({
                  success: true,
                  message: "Successfully fetched owned items",
                  data: ownedProducts          
                });
            } else {
                res
                .status(200)
                .json({
                  success: true,
                  message: "Successfully fetched owned items",
                  data: []          
                }); 
            }

        } catch (error) {
            res.status(401).json({ message: 'Something went wrong. Please try again.' });
        }

    } else {
        res.status(401).json({ message: 'User not found' });
    }


});



