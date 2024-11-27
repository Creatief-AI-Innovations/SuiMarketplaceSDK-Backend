
import jwt from "jsonwebtoken";


export const createJWTToken = (userId : number) => {
    return new Promise((resolve, reject) => {
      let payload = {
        id: userId
      }
      try {
        let token = jwt.sign(payload, process.env.JWT_SECRET_TOKEN!, {
          expiresIn: "15d"
        });
        return resolve(token);
      } catch (err) {
        // console.log("JWT err: ", err)
        reject(err);
      }
    })
  }


  export const verifyJWT = (token : string) => {
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET_TOKEN!);
        console.log('Decode token : ', decoded);
        console.log(`User id : `, decoded.id);
        if (!decoded.id) {
          throw new Error();
        }
        return decoded;
      } catch (e) {
        console.error('Authentication error', e);
        return null
      }
  }