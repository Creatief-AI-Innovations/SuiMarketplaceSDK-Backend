import express, { Request, Response } from "express";
import { verifyApi, verifyUser } from "../../utils/utils";
import { fetchListedProductsForCollection } from "../../utils/TradePortManager";
import { User } from "../../models/user";
import { SuiTradingClient } from "@tradeport/sui-trading-sdk";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decrypt } from "../../utils/crypto.helper";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Project } from "../../models/project.model";
import { Transaction } from "@mysten/sui/transactions";

export const marketRouteV1 = express.Router();

/**
 * Fetch all products which are listed for sale for the provided collection.
 */
marketRouteV1.get("/products", verifyApi, verifyUser, (req: Request, res: Response) => {
  let params = req.query;
  console.log("requested collectionId = ", params.cid);
  let collectionId = params.cid as string;
  // @ts-ignore
  let userWallet = req.user?.wallet;
  fetchListedProductsForCollection(collectionId)
    .then((response) => {
      //console.log("successfully  fetched data from marketplace", response.data);
      let products = [];
      if (response?.data?.sui?.listings) {
        products = response.data.sui.listings;
        try {
          products = products.map((product: any) => {
            return {
              id: product.nft?.id,
              name: product.nft?.name,
              media_url: product.nft?.media_url,
              price: product.price,
              price_str: product.price_str,
              attributes: product.attributes,
              owned: product.nft?.owner ? product.nft.owner === userWallet : false,
              listings: [{ id: product.id, price: product.price }]
            }
          })
        } catch (error) {
          console.log(error);
        }
      }
      res.send({
        success: true,
        data: products,
      });
    })
    .catch((error) => {
      console.log("error = ", error)
      res.send({
        success: false,
        error: "Something went wrong.",
      });
    });
});

/**
 * Buy a product from the marketplace
 */
marketRouteV1.post(
  "/product/buy",
  verifyApi,
  verifyUser,
  async (req: Request, res: Response) => {
    // @ts-ignore
    let project: Project = req?.project;

    // @ts-ignore
    let user: User = req?.user;

    let productId = req.body?.pid;
    if (!productId) {
      res.status(401).json({ success: false, error: "product id not found!" });
      return;
    }

    if (project) {
      if (user) {

        const suiTradingClient = new SuiTradingClient({
          apiKey: process.env.TRADEPORT_KEY!,
          apiUser: process.env.TRADEPORT_USER!,
        });

        console.log("credentials : ", process.env.TRADEPORT_KEY, process.env.TRADEPORT_USER)

        const decoded_privateKey = decrypt(user.pkey);
        // console.log("decoded pkey =", decoded_privateKey);
        const keypair = Ed25519Keypair.fromSecretKey(decoded_privateKey);

        let suiWalletAddress = keypair.getPublicKey().toSuiAddress();
        console.log("public key from keypair === ", suiWalletAddress);

        try {
          const tx = await suiTradingClient.buyListings({
            listingIds: [productId],
            walletAddress: suiWalletAddress,
          });

          console.log(tx.toJSON());

          const rpcUrl = process.env.RPC_URL; //getFullnodeUrl('mainnet');
          const client = new SuiClient({ url: rpcUrl! });

          const gasOwnerWalletKeyPair = Ed25519Keypair.fromSecretKey(decrypt(project.wallet));
          tx.setSender(suiWalletAddress);
          tx.setGasOwner(gasOwnerWalletKeyPair.getPublicKey().toSuiAddress());
          console.log("public key from gas owner keypair === ", gasOwnerWalletKeyPair.getPublicKey().toSuiAddress());
  
          let signedTransaction = await tx.sign({signer : keypair, client});
          let tx2 = Transaction.from(signedTransaction.bytes);
          let signedtx2 = await tx2.sign({signer : gasOwnerWalletKeyPair, client});
  
          let result = await client.executeTransactionBlock({
            transactionBlock: signedtx2.bytes,
            signature:  [signedTransaction.signature, signedtx2.signature],
            requestType: 'WaitForLocalExecution',
            options: {
              showEvents: true,
              showEffects: true,
              showObjectChanges: true,
              showBalanceChanges: true,
              showInput: true,
            },
          });

          // let result = await client.signAndExecuteTransaction({
          //   signer: keypair,
          //   transaction: tx,
          // });

          const transaction = await client.waitForTransaction({
            digest: result.digest,
            options: {
              showEffects: true,
            },
          });

          res.status(200).json({
            success: true,
            message: "Successfully bought the product.",
          });
        } catch (error) {
          //@ts-ignore
          let errorMessage = error?.message;

          if (errorMessage === "No listings found" || errorMessage === "No valid gas coins found for the transaction.") {
            res.status(200).json({
              success: false,
              message: errorMessage,
            });
          } else {
            res.status(200).json({
              success: false,
              message: "something went wrong please try again",
            });
          }
          console.log("error = ", error);
        }
      }
    } else {
      res.status(401).json({ message: "Authentication Error" });
    }
  }
);

/**
 * List a provided product for sale in the marketplace
 */
marketRouteV1.post(
  "/product/sell",
  verifyApi,
  verifyUser,
  async (req: Request, res: Response) => {
    let productId = req.body?.pid;
    let price = req.body?.price;
    if (!productId) {
      res.status(401).json({ success: false, error: "product id not found!" });
      return;
    }

    if (!price) {
      res.status(401).json({ success: false, error: "price not found" });
      return;
    }

    // @ts-ignore
    let user = req.user as User;

    // @ts-ignore
    let project = req.project as Project;

    if (user) {
      console.log("key ", process.env.TRADEPORT_KEY);
      console.log("user ", process.env.TRADEPORT_USER);

      const suiTradingClient = new SuiTradingClient({
        apiKey: process.env.TRADEPORT_KEY!,
        apiUser: process.env.TRADEPORT_USER!,
      });

      const decoded_privateKey = decrypt(user.pkey);
      //   console.log("decoded pkey =", decoded_privateKey);
      const keypair = Ed25519Keypair.fromSecretKey(decoded_privateKey);

      let suiWalletAddress = keypair.getPublicKey().toSuiAddress();
      console.log("public key from keypair === ", suiWalletAddress);

      try {
        const tx = await suiTradingClient.listNfts({
          nfts: [
            {
              id: productId,
              listPriceInMist: price, //price In mist
            },
          ],
          walletAddress: suiWalletAddress,
        });

        console.log(tx.toJSON());

        const rpcUrl = process.env.RPC_URL; //getFullnodeUrl('mainnet');
        const client = new SuiClient({ url: rpcUrl! });

        const gasOwnerWalletKeyPair = Ed25519Keypair.fromSecretKey(decrypt(project.wallet));
        tx.setSender(suiWalletAddress);
        tx.setGasOwner(gasOwnerWalletKeyPair.getPublicKey().toSuiAddress());
        console.log("public key from gas owner keypair === ", gasOwnerWalletKeyPair.getPublicKey().toSuiAddress());

        let signedTransaction = await tx.sign({signer : keypair, client});
        let tx2 = Transaction.from(signedTransaction.bytes);
        let signedtx2 = await tx2.sign({signer : gasOwnerWalletKeyPair, client});

        let result = await client.executeTransactionBlock({
          transactionBlock: signedtx2.bytes,
          signature:  [signedTransaction.signature, signedtx2.signature],
          requestType: 'WaitForLocalExecution',
          options: {
            showEvents: true,
            showEffects: true,
            showObjectChanges: true,
            showBalanceChanges: true,
            showInput: true,
          },
        });

        // let result = await client.signAndExecuteTransaction({
        //   signer: keypair,
        //   transaction: tx,
        // });
        const transaction = await client.waitForTransaction({
          digest: result.digest,
          options: {
            showEffects: true,
          },
        });

        res
          .status(200)
          .json({
            success: true,
            message: "Successfully listed the product for sale",
          });
      } catch (error) {
        console.log(error);
        res
          .status(200)
          .json({
            success: false,
            message: "Something went wrong. Please try again.",
          });
      }
    } else {
      res.status(401).json({ message: "User not found" });
    }
  }
);


/**
 * List a provided product for sale in the marketplace
 */
marketRouteV1.post(
  "/product/list_for_sale",
  verifyApi,
  verifyUser,
  async (req: Request, res: Response) => {
    let productId = req.body?.pid;
    let price = req.body?.price;
    if (!productId) {
      res.status(401).json({ success: false, error: "product id not found!" });
      return;
    }

    if (!price) {
      res.status(401).json({ success: false, error: "price not found" });
      return;
    }

    // @ts-ignore
    let user = req.user as User;

    // @ts-ignore
    let project = req.project as Project;

    if (user) {
      console.log("key ", process.env.TRADEPORT_KEY);
      console.log("user ", process.env.TRADEPORT_USER);

      const suiTradingClient = new SuiTradingClient({
        apiKey: process.env.TRADEPORT_KEY!,
        apiUser: process.env.TRADEPORT_USER!,
      });

      const decoded_privateKey = decrypt(user.pkey);
      //   console.log("decoded pkey =", decoded_privateKey);
      const keypair = Ed25519Keypair.fromSecretKey(decoded_privateKey);

      let suiWalletAddress = keypair.getPublicKey().toSuiAddress();
      console.log("public key from keypair === ", suiWalletAddress);

      try {
        const tx = await suiTradingClient.listNfts({
          nfts: [
            {
              id: productId,
              listPriceInMist: price, //price In mist
            },
          ],
          walletAddress: suiWalletAddress,
        });

        console.log(tx.toJSON());

        const rpcUrl = process.env.RPC_URL; //getFullnodeUrl('mainnet');
        const client = new SuiClient({ url: rpcUrl! });

        const gasOwnerWalletKeyPair = Ed25519Keypair.fromSecretKey(decrypt(project.wallet));
        tx.setSender(suiWalletAddress);
        tx.setGasOwner(gasOwnerWalletKeyPair.getPublicKey().toSuiAddress());
        console.log("public key from gas owner keypair === ", gasOwnerWalletKeyPair.getPublicKey().toSuiAddress());

        let signedTransaction = await tx.sign({signer : keypair, client});
        let tx2 = Transaction.from(signedTransaction.bytes);
        let signedtx2 = await tx2.sign({signer : gasOwnerWalletKeyPair, client});

        let result = await client.executeTransactionBlock({
          transactionBlock: signedtx2.bytes,
          signature:  [signedTransaction.signature, signedtx2.signature],
          requestType: 'WaitForLocalExecution',
          options: {
            showEvents: true,
            showEffects: true,
            showObjectChanges: true,
            showBalanceChanges: true,
            showInput: true,
          },
        });

        // let result = await client.signAndExecuteTransaction({
        //   signer: keypair,
        //   transaction: tx,
        // });
        const transaction = await client.waitForTransaction({
          digest: result.digest,
          options: {
            showEffects: true,
          },
        });

        res
          .status(200)
          .json({
            success: true,
            message: "Successfully listed the product for sale",
          });
      } catch (error) {
        console.log(error);
        res
          .status(200)
          .json({
            success: false,
            message: "Something went wrong. Please try again.",
          });
      }
    } else {
      res.status(401).json({ message: "User not found" });
    }
  }
);

/**
 * UnList a provided product for from the marketplace
 */
marketRouteV1.post(
  "/product/unlist",
  verifyApi,
  verifyUser,
  async (req: Request, res: Response) => {
    let productId = req.body?.pid;
    if (!productId) {
      res.status(401).json({ success: false, error: "product id not found!" });
      return;
    }

    // @ts-ignore
    let user = req.user as User;
    
     // @ts-ignore
    let project = req.project as Project;

    if (user) {

      const suiTradingClient = new SuiTradingClient({
        apiKey: process.env.TRADEPORT_KEY!,
        apiUser: process.env.TRADEPORT_USER!,
      });

      const decoded_privateKey = decrypt(user.pkey);
      //   console.log("decoded pkey =", decoded_privateKey);
      const keypair = Ed25519Keypair.fromSecretKey(decoded_privateKey);

      let suiWalletAddress = keypair.getPublicKey().toSuiAddress();
      console.log("public key from keypair === ", suiWalletAddress);

      try {
        const tx = await suiTradingClient.unlistListings({
          listingIds: [productId],
          walletAddress: suiWalletAddress,
        });

        console.log(tx.toJSON());

        const rpcUrl = process.env.RPC_URL; //getFullnodeUrl('mainnet');
        const client = new SuiClient({ url: rpcUrl! });

        const gasOwnerWalletKeyPair = Ed25519Keypair.fromSecretKey(decrypt(project.wallet));
        tx.setSender(suiWalletAddress);
        tx.setGasOwner(gasOwnerWalletKeyPair.getPublicKey().toSuiAddress());
        console.log("public key from gas owner keypair === ", gasOwnerWalletKeyPair.getPublicKey().toSuiAddress());
  
        // const kindBytes = await tx.build( {client, onlyTransactionKind : true });
        // // construct a sponsored transaction from the kind bytes
        // const sponsoredtx = Transaction.fromKind(kindBytes);

      
        let signedTransaction = await tx.sign({signer : keypair, client});
        let tx2 = Transaction.from(signedTransaction.bytes);
        let signedtx2 = await tx2.sign({signer : gasOwnerWalletKeyPair, client});

        let result = await client.executeTransactionBlock({
          transactionBlock: signedtx2.bytes,
          signature:  [signedTransaction.signature, signedtx2.signature],
          requestType: 'WaitForLocalExecution',
          options: {
            showEvents: true,
            showEffects: true,
            showObjectChanges: true,
            showBalanceChanges: true,
            showInput: true,
          },
        });

        // let result = await client.signAndExecuteTransaction({
        //   signer: keypair,
        //   transaction: tx2,
        // });

        const transaction = await client.waitForTransaction({
          digest: result.digest,
          options: {
            showEffects: true,
          },
        });

        res
          .status(200)
          .json({
            success: true,
            message: "Successfully unlisted the product from marketplace",
          });
      } catch (error) {
        console.log(error);
        res
          .status(401)
          .json({ message: "Something went wrong. Please try again." });
      }
    } else {
      res.status(401).json({ message: "User not found" });
    }
  }
);
