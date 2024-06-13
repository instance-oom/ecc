import { Base64 } from 'js-base64';
import bigInt from 'big-integer';
import { gamalDecrypt, gamalEncrypt } from './ecc-calc';
import BigPoint from './bigpoint';

const encrypt = (decipherText: string, pubKey: string) => {
  if (typeof decipherText !== 'string' || !decipherText) return '';
  let pubKeyObj: any = null;
  try {
    pubKeyObj = JSON.parse(Base64.atob(pubKey));
  } catch (ex) {
    throw new Error('invalid public key');
  }
  const n = bigInt(pubKeyObj.N);
  return pubKeyObj.Disabled ? decipherText : gamalEncrypt(decipherText, bigInt(pubKeyObj.Prime), bigInt(pubKeyObj.A), bigInt(pubKeyObj.B), n, new BigPoint(pubKeyObj.G), new BigPoint(pubKeyObj.Key), true);
};

const decrypt = (ciphertext: string, priKey: string) => {
  if (typeof ciphertext !== 'string' || !ciphertext) return '';
  let priKeyObj: any = null;
  try {
    priKeyObj = JSON.parse(Base64.atob(priKey));
  } catch (ex) {
    throw new Error('invalid public key');
  }
  return priKeyObj.Disabled ? ciphertext : gamalDecrypt(ciphertext, bigInt(priKeyObj.Prime), bigInt(priKeyObj.A), bigInt(priKeyObj.B), bigInt(priKeyObj.Key));
};

export { encrypt, decrypt };
