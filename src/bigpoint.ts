import bigInt from 'big-integer';

class BigPoint {
  X: bigInt.BigInteger | null = null;
  Y: bigInt.BigInteger | null = null;
  IsInfinity = false;

  constructor(bigPoint?: any) {
    if (!bigPoint) return;
    if (bigPoint.X !== undefined && bigPoint.X != null) {
      this.X = bigInt(bigPoint.X);
    }
    if (bigPoint.Y !== undefined && bigPoint.Y != null) {
      this.Y = bigInt(bigPoint.Y);
    }
    if (bigPoint.IsInfinity === true || bigPoint.IsInfinity === false) {
      this.IsInfinity = bigPoint.IsInfinity;
    } else if (this.X && this.Y) {
      this.IsInfinity = false;
    } else {
      this.IsInfinity = true;
    }
  }
}

export default BigPoint;
