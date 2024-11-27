
import request from 'request';


/**
 * Fetch nfts that are listed from the provided collection 
 * @returns 
 */
export async function fetchListedProductsForCollection(collectionId: string): Promise<any> {

    return new Promise<any>((resolve, reject) => {
        try {

            let userAgent = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 Edg/130.0.0.0';
            
            let xAPIUser = process.env.TRADEPORT_USER;
            let xAPIKEY = process.env.TRADEPORT_KEY; 

            const options = {
                method: 'POST',
                url: 'https://api.indexer.xyz/graphql',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': '*/*',
                    'user-agent': userAgent,
                    'x-api-user': xAPIUser,
                    'x-api-key': xAPIKEY,
                },
                body: {
                    operationName: 'fetchCollectionListings',
                    // variables: {
                    //   condition: { project_ids: [{ project_id: '0066536e-8418-4b3f-8edf-a1512c46c9df' }] },
                    //   orderBy: { field_name: 'listing_display_price', sort_order: 'ASC' },
                    //   paginationInfo: { page_number: 1, page_size: 100 }
                    // },
                    query: `query fetchCollectionListings {
                      sui {
                        listings(
                          where: {
                            collection_id: { _eq: "${collectionId}" }
                            listed: { _eq: true }
                          }
                          order_by: { price: asc_nulls_last }
                        ) {
                          id
                          price
                          collection_id
                          price_str
                          block_time
                          seller
                          market_name
                          nonce
                          nft {
                            id
                            token_id
                            name
                            media_url
                            media_type
                            ranking
                            owner
                            attributes {
                              id
                              value
                              type
                              score
                              rarity
                            }
                          
                          }
                        }
                      }
                    }`
                },
                json: true,
                //jar: 'JAR'
            };

            console.log("listing marketplace ");
            request(options, function (error, response, body) {
                if (error) {
                    console.log("testingg error ", error);
                    //throw new Error(error);
                    reject();
                }
                // console.log(body);
                // console.log("-------------------------------------------------", response);
                // console.log(JSON.stringify(body));
                // console.log("response = ", formatJSONResponse(body));

                resolve(body);

            });

        } catch (error) {
            reject();
        }
    });
}







/**
 * Fetch the list of products owned by a wallet
 * @returns 
 */
export async function fetchListOfProductsOwnedByWallet(wallet: string, offset : number = 0, limit : number = 40): Promise<any> {

  return new Promise<any>((resolve, reject) => {
      try {

          let xAPIUser = process.env.TRADEPORT_USER;
          let xAPIKEY = process.env.TRADEPORT_KEY; 
          let userAgent = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 Edg/130.0.0.0';


          const options = {
              method: 'POST',
              url: 'https://api.indexer.xyz/graphql',
              headers: {
                  'Content-Type': 'application/json',
                  'accept': '*/*',
                  'user-agent': userAgent,
                  'x-api-user': xAPIUser,
                  'x-api-key': xAPIKEY,
              },
              body: {
                  operationName: 'fetchWalletOwnership',
                  variables: {"where":{"owner":{"_eq": wallet }},"offset":offset,"limit":limit},
                  query : `query fetchWalletOwnership(
                    $where: nfts_bool_exp
                    $order_by: [nfts_order_by!]
                    $offset: Int
                    $limit: Int!
                  ) {
                    sui {
                      
                      nfts(where: $where, order_by: $order_by, offset: $offset, limit: $limit) {
                        id
                        token_id
                        name
                        media_url
                        media_type
                        ranking
                        owner
                        delegated_owner
                        burned
                        staked
                        version
                        collection {
                          id
                          title
                        }
                        attributes {
                          id
                          value
                          type
                          score
                          rarity
                        }
                        listings(where: { listed: { _eq: true } }, order_by: { price: asc }) {
                          id
                          price
                        }
                      }
                    }
                  }`
              },
              json: true,
              //jar: 'JAR'
          };

          console.log("listing marketplace ");
          request(options, function (error, response, body) {
              if (error) {
                  console.log("owned products", error);
                  reject();
              }

              resolve(body);
          });

      } catch (error) {
          reject();
      }
  });
}







