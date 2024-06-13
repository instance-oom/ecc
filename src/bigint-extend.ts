import bigInt from 'big-integer';

const toByteArray = (bInt: bigInt.BigInteger) => {
  let bytes = bInt.toString(2);
  const arr: number[] = [];
  while (bytes.length > 0) {
    const idx = Math.max(0, bytes.length - 8);
    arr.push(parseInt(bytes.substring(idx), 2));
    bytes = bytes.substring(0, idx);
  }
  if (arr[arr.length - 1] >= 128) arr.push(0);
  return arr;
};

const toBase256Byte = (bInt: bigInt.BigInteger) => {
  const arr = toByteArray(bInt);
  arr.reverse();
  return arr;
};

const toBase256String = (bInt: bigInt.BigInteger) => {
  const tmpByte = toByteArray(bInt);
  let str256 = '';
  tmpByte.forEach(b => {
    str256 = String.fromCharCode(b) + str256;
  });
  return str256;
};

const base256ToBigInt = (str256: string) => {
  const tmpByte = [];
  for (let i = 0; i < str256.length; ++i) {
    let x = `00000000${str256.charCodeAt(i).toString(2)}`;
    tmpByte.push(x.substring(x.length - 8));
  }
  return bigInt(tmpByte.join(''), 2);
};

const modAbs = (a: bigInt.BigInteger, b: bigInt.BigInteger) => {
  let tmp = a.mod(b);
  if (tmp.isNegative()) tmp = tmp.add(b);
  return tmp;
};

const getModInv = (n: bigInt.BigInteger, p: bigInt.BigInteger) => {
  let b1 = bigInt.zero,
    b2 = bigInt.one,
    r1 = bigInt(p),
    r2 = bigInt(n),
    b3,
    q,
    r3;
  q = r1.divide(r2);
  r3 = r1.mod(r2);
  b3 = b1.subtract(q.multiply(b2));
  while (r3.greater(bigInt.one)) {
    r1 = bigInt(r2);
    r2 = bigInt(r3);
    b1 = bigInt(b2);
    b2 = bigInt(b3);
    q = r1.divide(r2);
    r3 = r1.mod(r2);
    b3 = b1.subtract(q.multiply(b2));
  }
  return b3;
};

export { toByteArray, toBase256Byte, toBase256String, base256ToBigInt, modAbs, getModInv };
