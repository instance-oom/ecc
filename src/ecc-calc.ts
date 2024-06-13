import bigInt from 'big-integer';
import { Base64 } from 'js-base64';
import BigPoint from './bigpoint';
import { toBase256Byte, base256ToBigInt, modAbs, getModInv, toBase256String } from './bigint-extend';

const gamalEncrypt = (decipherText: string, prime: bigInt.BigInteger, a: bigInt.BigInteger, b: bigInt.BigInteger, n: bigInt.BigInteger, g: BigPoint, y: BigPoint, compression: boolean) => {
  let t,
    c,
    bTemp = [],
    temp,
    temp1;
  let pTemp1 = new BigPoint(),
    pTemp2,
    pTemp3,
    pTemp4;
  pTemp1.IsInfinity = true;
  let k;

  bTemp = toBase256Byte(prime);
  t = bTemp.length - 3;
  temp = decipherText;
  let isOK = false;
  let cipherByte = [];
  while (temp.length > 0) {
    k = randomBigInt(bigInt(Number.MAX_SAFE_INTEGER), n);
    c = 0;
    isOK = false;
    while (!isOK) {
      temp1 = temp.substring(0, Math.min(t - c, temp.length));
      isOK = inbedStringOnEC(temp1, prime, a, b, pTemp1);
      if (isOK) {
        break;
      }
      pTemp1.IsInfinity = true;
      ++c;
    }
    temp = temp.substring(Math.min(t - c, temp.length));
    pTemp2 = getPointKeyMultiple(y, prime, a, k);
    pTemp3 = getPointKeyMultiple(g, prime, a, k);
    pTemp4 = addPoints(pTemp1, pTemp2, prime, a);
    cipherByte.push(...pointToByte(pTemp4, prime, compression));
    cipherByte.push(...pointToByte(pTemp3, prime, compression));
  }
  return Base64.btoa(String.fromCharCode(...cipherByte));
};

const gamalDecrypt = (cipherText: string, prime: bigInt.BigInteger, a: bigInt.BigInteger, b: bigInt.BigInteger, x: bigInt.BigInteger) => {
  const bTemp = toBase256Byte(prime);
  const t = bTemp.length;

  let temp = String.fromCharCode(...Base64.toUint8Array(cipherText));
  let temp1: string = '';
  let decipherText = '';
  let i = temp.length;
  while (temp.length > 0) {
    let currentByte = temp.charCodeAt(0);
    if (currentByte === 0) i = 1;
    if (currentByte === 4) i = 2 * t + 1;
    if (currentByte === 2 || currentByte === 3) i = t + 1;
    temp1 = temp.substring(0, i);
    temp = temp.substring(i);
    const pTemp1 = stringToPoint(temp1, prime, a, b);

    currentByte = temp.charCodeAt(0);
    if (currentByte === 0) i = 1;
    if (currentByte === 4) i = 2 * t + 1;
    if (currentByte === 2 || currentByte === 3) i = t + 1;
    temp1 = temp.substring(0, i);
    temp = temp.substring(i);
    const pTemp2 = stringToPoint(temp1, prime, a, b);

    const pTemp3 = getPointKeyMultiple(pTemp2, prime, a, x);
    const pTemp4 = addPoints(pTemp1, getPointInverse(pTemp3, prime), prime, a);
    decipherText = decipherText + extractInbeddedString(pTemp4);
  }
  return decipherText;
};

const randomBigInt = (min: bigInt.BigInteger, max: bigInt.BigInteger) => {
  min = bigInt(min);
  max = bigInt(max);
  let r = bigInt.randBetween(min, max);
  if (r.compare(max) >= 0 && r.compare(min) >= 0 && min.compare(max) < 0) {
    r = r.prev();
  }
  return r;
};

const inbedStringOnEC = (inString: string, prime: bigInt.BigInteger, a: bigInt.BigInteger, b: bigInt.BigInteger, p: BigPoint) => {
  let bTemp,
    temp = '',
    pad,
    l = 0,
    limit = bigInt.one,
    counter,
    temp1,
    temp2,
    temp3,
    ySquare = bigInt.zero;
  let isOk = false;
  bTemp = toBase256Byte(prime);
  if (bTemp.length >= inString.length + 3) {
    pad = Math.min(255, bTemp.length - inString.length - 2);
    temp = String.fromCharCode(pad) + inString;
    let i = 0;
    for (; i < pad; ++i) {
      temp += String.fromCharCode(0);
    }
    p.X = base256ToBigInt(temp);
    temp = '1';
    for (i = 0; i < pad; ++i) {
      temp += '00000000';
    }
    limit = bigInt(temp, 2);
    counter = bigInt.zero;

    while (!isOk && counter.abs().lesser(limit.abs())) {
      counter = counter.add(1);
      temp1 = modAbs(p.X.pow(2), prime);
      temp2 = modAbs(p.X.multiply(temp1), prime);
      temp1 = modAbs(a.multiply(p.X), prime);
      temp3 = modAbs(temp1.add(temp2), prime);
      ySquare = modAbs(temp3.add(b), prime);
      l = legendreSymbol(ySquare, prime, l);
      if (l === 1) {
        isOk = true;
      } else {
        p.X = p.X.add(bigInt.one);
      }
    }
    if (isOk) {
      p.Y = getSquareRootModP(ySquare, prime);
      p.IsInfinity = false;
    }
  }
  return isOk;
};

const legendreSymbol = (a: bigInt.BigInteger, p: bigInt.BigInteger, ll?: number) => {
  let l = ll;
  let temp1,
    temp2,
    temp3,
    temp4,
    temp5,
    i = 0;
  temp1 = modAbs(a, p);
  if (temp1.equals(bigInt.zero)) {
    l = 0;
  } else {
    temp1 = bigInt(p);
    temp2 = bigInt(a);
    l = 1;
    while (temp2.abs().notEquals(bigInt.one)) {
      if (temp2.isEven()) {
        temp3 = temp1.pow(2);
        temp4 = temp3.subtract(bigInt.one);
        i = temp4.mod(8).toJSNumber();
        temp3 = temp4.subtract(i).divide(8);
        if (!temp3.isEven()) {
          l = l * -1;
        }
        i = temp2.mod(2).toJSNumber();
        temp2 = temp2.subtract(i).divide(2);
      } else {
        temp3 = temp1.subtract(bigInt.one);
        temp4 = temp2.subtract(bigInt.one);
        temp5 = temp3.multiply(temp4);
        i = temp5.mod(4).toJSNumber();
        temp3 = temp5.subtract(i).divide(4);
        if (!temp3.isEven()) {
          l = l * -1;
        }
        temp3 = modAbs(temp1, temp2);
        temp1 = bigInt(temp2);
        temp2 = bigInt(temp3);
      }
    }
  }
  return l;
};

const getSquareRootModP = (square: bigInt.BigInteger, p: bigInt.BigInteger) => {
  let n = bigInt(10),
    b,
    s,
    r,
    temp,
    temp1,
    temp2;
  let a = 0,
    l;
  l = legendreSymbol(n, p);
  while (l !== -1) {
    n = n.add(bigInt.one);
    l = legendreSymbol(n, p);
  }
  s = bigInt(p);
  s = s.subtract(bigInt.one);
  while (s.isEven()) {
    s = s.shiftRight(1);
    ++a;
  }
  b = n.modPow(s, p);
  temp = s.add(bigInt.one);
  temp = temp.shiftRight(1);
  r = square.modPow(temp, p);
  temp1 = getModInv(square, p);
  for (let i = 0; i <= a - 2; ++i) {
    temp2 = modAbs(r.pow(2), p);
    temp = modAbs(temp1.multiply(temp2), p);
    for (let j = 1; j <= a - i - 2; ++j) {
      temp2 = modAbs(temp.pow(2), p);
      temp = bigInt(temp2);
    }
    if (temp.abs().notEquals(bigInt.one)) {
      r = modAbs(r.multiply(b), p);
    }
    if (i === a - 2) {
      break;
    }
    b = modAbs(b.pow(2), p);
  }
  return r;
};

const getPointKeyMultiple = (g: BigPoint, prime: bigInt.BigInteger, a: bigInt.BigInteger, priK: bigInt.BigInteger) => {
  let puK = new BigPoint();
  puK.X = bigInt.zero;
  puK.Y = bigInt.zero;
  puK.IsInfinity = true;
  let temp = priK.toString(2);
  for (let i = 0; i < temp.length; ++i) {
    if (temp[i] === '1') {
      puK = addPoints(puK, g, prime, a);
    }
    if (i + 1 < temp.length) {
      puK = doublePoint(puK, prime, a);
    }
  }
  return puK;
};

const getPointInverse = (p: BigPoint, prime: bigInt.BigInteger) => {
  if (p.IsInfinity) return p;
  const inv = new BigPoint({ IsInfinity: false });
  inv.X = p.X;
  inv.Y = prime.minus(p.Y!);
  return inv;
};

const addPoints = (puK: BigPoint, g: BigPoint, prime: bigInt.BigInteger, a: bigInt.BigInteger) => {
  if (puK.IsInfinity) {
    return g;
  }
  if (g.IsInfinity) {
    return puK;
  }
  if (puK.X!.abs().equals(g.X!.abs())) {
    if (puK.Y!.abs().equals(g.Y!.abs())) {
      return doublePoint(puK, prime, a);
    } else {
      let r = new BigPoint();
      r.X = bigInt.zero;
      r.Y = bigInt.zero;
      r.IsInfinity = true;
      return r;
    }
  } else {
    let tpuK = new BigPoint();

    let temp2 = bigInt.zero.subtract(puK.Y!);
    let temp3 = modAbs(g.Y!.add(temp2), prime);

    temp2 = bigInt.zero.subtract(puK.X!);
    let temp1 = modAbs(g.X!.add(temp2), prime);

    temp2 = getModInv(temp1, prime);

    temp1 = modAbs(temp3.multiply(temp2), prime);

    let temp4 = modAbs(temp1.pow(2), prime);

    temp2 = bigInt.zero.subtract(puK.X!);
    temp3 = modAbs(temp4.add(temp2), prime);

    temp2 = bigInt.zero.subtract(g.X!);

    tpuK.X = modAbs(temp3.add(temp2), prime);

    temp2 = bigInt.zero.subtract(tpuK.X);
    temp3 = modAbs(puK.X!.add(temp2), prime);

    temp2 = modAbs(temp1.multiply(temp3), prime);

    temp3 = bigInt.zero.subtract(puK.Y!);
    tpuK.Y = modAbs(temp2.add(temp3), prime);
    tpuK.IsInfinity = false;
    return tpuK;
  }
};

const doublePoint = (puK: BigPoint, prime: bigInt.BigInteger, a: bigInt.BigInteger) => {
  if (puK.IsInfinity) {
    return puK;
  }
  if (puK.Y!.equals(bigInt.zero)) {
    let r = new BigPoint();
    r.X = bigInt.zero;
    r.Y = bigInt.zero;
    r.IsInfinity = true;
    return r;
  }
  let tpuK = new BigPoint();
  tpuK.IsInfinity = false;

  let temp1 = modAbs(puK.X!.pow(2), prime);
  let temp2 = modAbs(temp1.add(temp1), prime);
  let temp3 = modAbs(temp1.add(temp2), prime);

  temp2 = modAbs(temp3.add(a), prime);

  temp1 = modAbs(puK.Y!.add(puK.Y!), prime);

  temp3 = getModInv(temp1, prime);

  temp1 = modAbs(temp3.multiply(temp2), prime);
  temp2 = modAbs(puK.X!.add(puK.X!), prime);
  temp3 = modAbs(temp1.pow(2), prime);

  temp2 = bigInt.zero.subtract(temp2);

  tpuK.X = modAbs(temp3.add(temp2), prime);

  temp2 = bigInt.zero.subtract(tpuK.X);
  temp3 = modAbs(puK.X!.add(temp2), prime);

  temp2 = modAbs(temp3.multiply(temp1), prime);

  temp1 = bigInt.zero.subtract(puK.Y!);
  tpuK.Y = modAbs(temp2.add(temp1), prime);

  return tpuK;
};

const pointToByte = (g: BigPoint, prime: bigInt.BigInteger, compression: boolean) => {
  if (g.IsInfinity) {
    return [];
  }
  let l = toBase256Byte(prime).length;
  let bytes = toBase256Byte(g.X!);

  while (bytes.length < l) {
    bytes.unshift(0);
  }
  if (compression) {
    bytes.unshift((g.Y!.isEven() ? 0 : 1) + 2);
  } else {
    let temp = toBase256Byte(g.Y!);
    while (temp.length < l) {
      temp.unshift(0);
    }
    bytes.unshift(4);
    bytes.push(...temp);
  }
  return bytes;
};

const stringToPoint = (k: string, prime: bigInt.BigInteger, a: bigInt.BigInteger, b: bigInt.BigInteger) => {
  if (!k) return new BigPoint({ X: 0, Y: 0, IsInfinity: true });
  const result = new BigPoint({ IsInfinity: false });
  let l = toBase256Byte(prime).length;
  if (k.charCodeAt(0) === 4) {
    k = k.substring(1);
    result.X = base256ToBigInt(k.substring(0, l));
    result.Y = base256ToBigInt(k.substring(l, l + l));
  } else {
    result.X = base256ToBigInt(k.substring(1, 1 + l));
    let temp1 = result.X.pow(2).mod(prime),
      temp2 = temp1.times(result.X).mod(prime);
    temp1 = result.X.times(a).mod(prime);
    let temp3 = temp1.add(temp2).mod(prime);
    temp1 = temp3.add(b).mod(prime);
    temp2 = getSquareRootModP(temp1, prime);
    if ((temp2.isEven() ? 0 : 1) + 2 === k.charCodeAt(0)) {
      result.Y = temp2;
    } else {
      result.Y = prime.minus(temp2);
    }
  }
  return result;
};

const extractInbeddedString = (p: BigPoint) => {
  let inBedString = toBase256String(p.X!);
  let b = inBedString.charCodeAt(0);
  inBedString = inBedString.substring(1);
  inBedString = inBedString.substring(0, inBedString.length - b);
  return inBedString;
};

export { gamalEncrypt, gamalDecrypt };
