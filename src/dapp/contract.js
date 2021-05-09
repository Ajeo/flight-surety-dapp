import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";

export default class Contract {
  constructor(network, callback) {
    let config = Config[network];
    this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );
    this.initialize(callback);
    this.owner = null;
    this.airlines = [];
    this.passengers = [];
  }

  initialize(callback) {
    this.web3.eth.getAccounts((error, accts) => {
      this.owner = accts[0];

      let counter = 1;

      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++]);
      }

      this.fundAirline(this.airlines[3]);

      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }

      callback();
    });
  }

  registerAirline(airlineAddress) {
    let self = this;
    self.flightSuretyApp.methods
      .registerAirline(airlineAddress)
      .send({ from: this.owner }, (error, result) => {
        if (error) console.log("registerAirline error:", error);
        if (result) console.log("registerAirline result:", result);
      });
  }

  fundAirline(airlineAddress) {
    let self = this;
    const amount = Web3.utils.toWei("10", "ether");

    self.flightSuretyApp.methods
      .fund()
      .send({ from: airlineAddress, value: amount }, (error, result) => {
        console.log(error, result);
      });
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback);
  }

  buyInsurance(amount, flight, callback) {
    let self = this;

    try {
      let payload = {
        airline: self.airlines[3],
        flight,
        amount: self.web3.utils.toWei(amount, "ether").toString(),
        timestamp: Math.floor(Date.now() / 1000),
      };

      self.flightSuretyApp.methods
        .buyInsurance(payload.airline)
        .send(
          { from: self.passengers[3], value: payload.amount },
          (error, result) => {
            callback(error, result);
          }
        );
    } catch (error) {
      console.log(error);
    }
  }

  withdraw(callback) {
    let self = this;

    try {
      self.flightSuretyApp.methods
        .withdraw()
        .send({ from: self.passengers[3] }, (error, result) => {
          callback(error, result);
        });
    } catch (error) {
      console.log(error);
    }
  }

  fetchFlightStatus(flight, callback) {
    let self = this;
    let payload = {
      airline: self.airlines[3],
      flight: flight,
      timestamp: Math.floor(Date.now() / 1000),
    };

    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.owner }, (error, result) => {
        console.log(error, payload);
        callback(error, payload);
      });
  }
}
