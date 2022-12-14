import express, { Request, Response } from 'express';
require('dotenv').config();

interface Input {
  mileage: number;
  congestionCharge: 'yes' | 'no';
  driverTime: number;
  numberOfFloor: number;
  lateCharge: 'yes' | 'no';
  carbonOffSet: 'yes' | 'no';
  vanType: 'small' | 'medium' | 'large' | 'luton';
}

const app = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Server up. Send POST request to /totalPrice with input fields in body.');
});

app.post('/totalPrice', (req: Request, res: Response) => {
  console.log(req.body);
  const input: Input = req.body;
  const {
    mileage,
    congestionCharge,
    driverTime,
    numberOfFloor,
    lateCharge,
    carbonOffSet,
    vanType,
  } = input;

  // confirm that all inputs are defined:
  if (
    !(
      mileage &&
      congestionCharge &&
      driverTime &&
      numberOfFloor &&
      lateCharge &&
      carbonOffSet &&
      vanType
    )
  ) {
    return res.status(403).send('All fields are required.');
  }

  // check the enum fields:
  if (
    !(
      (congestionCharge === 'yes' || congestionCharge === 'no') &&
      (lateCharge === 'yes' || lateCharge === 'no') &&
      (carbonOffSet === 'yes' || carbonOffSet === 'no') &&
      (vanType === 'small' ||
        vanType === 'medium' ||
        vanType === 'large' ||
        vanType === 'luton')
    )
  ) {
    return res.status(403).send('Invalid inputs.');
  }

  // proceed with request
  const unitFloorCost = 7.5;
  const congestionCost = congestionCharge === 'yes' ? 15 : 0;
  const helperTimeChargePerHour = 20;
  const driverTimeCostPerHour = {
    small: 50,
    medium: 60,
    large: 70,
    luton: 90,
  };

  const lateCost =
    lateCharge === 'yes' ? driverTimeCostPerHour[vanType] / 4 : 0;
  const carbonOffSetCost = carbonOffSet === 'yes' ? 5 : 0;
  const perMileFare = 1.1;

  const standardUnloadingLoadingTime = {
    small: 60,
    medium: 60,
    large: 120, // table value used
    luton: 180,
  };

  let actualUnloadingLoadingTime: number;
  let totalTime: number;
  if (driverTime < 60) {
    actualUnloadingLoadingTime = 60 + (60 - driverTime);
    totalTime = actualUnloadingLoadingTime + driverTime;
  } else {
    totalTime =
      standardUnloadingLoadingTime[vanType] + Math.round(driverTime / 30) * 30;
  }
  // to the nearest 0.5 multiple in hours:
  totalTime = Math.round((totalTime / 60) * 2) / 2;
  console.log('Total time: ', totalTime);

  const driverCharge = driverTimeCostPerHour[vanType] * totalTime;
  console.log('driver charge: ', driverCharge);
  const helperCharge = helperTimeChargePerHour * totalTime;

  const price =
    driverCharge +
    helperCharge +
    unitFloorCost * numberOfFloor +
    congestionCost +
    lateCost +
    carbonOffSetCost +
    mileage * perMileFare;

  res.status(200).json({ totalPrice: price });
});

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server up at port ${port}`);
});
