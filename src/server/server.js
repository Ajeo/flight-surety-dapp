import "regenerator-runtime/runtime";
import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";

let config = Config["localhost"];
let web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
);
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(
  FlightSuretyApp.abi,
  config.appAddress
);

let oracles = {};
let eventIndex = null;
const gas = 6721975;
const gasPrice = 200000000;

const flights = [
  { id: 1, name: "PUPI4969" },
  { id: 2, name: "PUPI6466" },
  { id: 3, name: "PUPI6754" },
  { id: 4, name: "PUPI7454" },
  { id: 5, name: "PUPI4523" },
];

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

const STATUS_CODES = [
  STATUS_CODE_UNKNOWN,
  STATUS_CODE_ON_TIME,
  STATUS_CODE_LATE_AIRLINE,
  STATUS_CODE_LATE_WEATHER,
  STATUS_CODE_LATE_TECHNICAL,
  STATUS_CODE_LATE_OTHER,
];

// Init oracles
web3.eth.getAccounts(async (error, accounts) => {
  const fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();

  for (let i = 10; i < 34; i++) {
    const registrationResult = flightSuretyApp.methods
      .registerOracle()
      .send({ from: accounts[i], value: `${fee}`, gas, gasPrice });

    registrationResult
      .then((result) => {
        flightSuretyApp.methods
          .getMyIndexes()
          .call({ from: accounts[i] })
          .then((indexes) => {
            console.log(
              `After oracle getting their indexes ${indexes} ${Object.values(
                indexes
              )}`
            );
            oracles[accounts[i]] = [].concat.apply([], Object.values(indexes));
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

flightSuretyApp.events.OracleRequest(
  {
    fromBlock: 0,
  },
  (error, event) => {
    if (error) {
      console.log("OracleRequest", error);
    }
    console.log("OracleRequest", event);

    const airline = event.returnValues.airline;
    const flight = event.returnValues.flight;
    const timestamp = event.returnValues.timestamp;
    const statusCode =
      STATUS_CODES[Math.floor(Math.random() * STATUS_CODES.length)];
    const address = Object.keys(oracles);

    for (let i = 0; i < address.length; i++) {
      for (let idx = 0; idx < 3; idx++) {
        flightSuretyApp.methods
          .submitOracleResponse(
            oracles[address[i]][idx],
            airline,
            flight,
            timestamp,
            statusCode
          )
          .send({
            from: address[i],
          })
          .then(() => {
            console.log(`oracle ${address[i]} accept request`);
          })
          .catch((error) => {
            console.log(`oracle ${address[i]} reject request`);
          });
      }
    }
  }
);

flightSuretyApp.events.BuyInsurance(
  {
    fromBlock: 0,
  },
  (error, event) => {
    if (error) {
      console.log("BuyInsurance", error);
    }
    console.log("BuyInsurance", event);
  }
);

flightSuretyApp.events.OracleReport(
  {
    fromBlock: 0,
  },
  (error, event) => {
    if (error) {
      console.log("OracleReport", error);
    }
    console.log("OracleReport", event);
  }
);

flightSuretyApp.events.FlightStatusInfo(
  {
    fromBlock: 0,
  },
  (error, event) => {
    if (error) {
      console.log("FlightStatusInfo", error);
    }
    console.log("FlightStatusInfo", event);
  }
);

flightSuretyApp.events.Withdraw(
  {
    fromBlock: 0,
  },
  (error, event) => {
    if (error) {
      console.log("Withdraw", error);
    }
    console.log("Withdraw", event);
  }
);

const app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/api/flights", (req, res, next) => {
  return res.status(200).json({ flights });
});

app.get("/api/event-index", (req, res, next) => {
  return res.status(200).json({ eventIndex });
});

export default app;
