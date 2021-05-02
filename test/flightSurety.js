
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {
    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {

        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");

    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try 
        {
            await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
        }
        catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
                
    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try 
        {
            await config.flightSuretyData.setOperatingStatus(false);
        }
        catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
        
    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

        await config.flightSuretyData.setOperatingStatus(false);

        let reverted = false;
        try 
        {
            await config.flightSurety.setTestingMode(true);
        }
        catch(e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);

    });

    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
        
        // ARRANGE
        let newAirline = accounts[2];

        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
        }
        catch(e) {

        }
        let result = await config.flightSuretyData.isAirline.call(newAirline); 

        // ASSERT
        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

    });

    it('only existing airline may register a new airline until there are at least four airlines registered', async () => {
        const airline1 = accounts[1];
        const airline2 = accounts[2];
        const airline3 = accounts[3];
        const airline4 = accounts[4];

        await config.flightSuretyApp.registerAirline(airline1, { from: config.owner });
        await config.flightSuretyApp.registerAirline(airline2, { from: config.owner });
        await config.flightSuretyApp.registerAirline(airline3, { from: config.owner });
        await config.flightSuretyApp.registerAirline(airline4, { from: config.owner });

        const result = await config.flightSuretyData.isAirline.call(airline4); 
        
        assert.equal(result, false, "Passed, didn't register fourth airline without multisig");
    });

    it('Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {
        const airline1 = accounts[1];
        const airline2 = accounts[2];
        const airline3 = accounts[3];
        const airline4 = accounts[4];

        await config.flightSuretyApp.registerAirline(airline1, { from: config.owner });
        await config.flightSuretyApp.registerAirline(airline2, { from: config.owner });
        await config.flightSuretyApp.registerAirline(airline3, { from: config.owner });

        const registrationStatus = await config.flightSuretyApp.registerAirline.call(airline4, { from: config.owner });
        const status = await config.flightSuretyData.isAirline.call(airline4);
  
        if (registrationStatus[0] == false && registrationStatus[1].toNumber() == 0) {
          await config.flightSuretyApp.approveAirlineRegistration(airline4, { from: config.owner });
          await config.flightSuretyApp.approveAirlineRegistration(airline4, { from: airline2 });
          await config.flightSuretyApp.approveAirlineRegistration(airline4, { from: airline3 });
        }

        await config.flightSuretyApp.registerAirline(airline4, { from: config.owner });
        const result = await config.flightSuretyData.isAirline.call(airline4);

        assert.equal(status, false, "5th airline should not be registered without voting");
        assert.equal(result, true, "Multi-party voting works");
    });

    it('Airline can be registered, but does not participate in contract until it submits funding of 10 ether', async () => {
        const airline2 = accounts[2];
        const fundAmount = web3.utils.toWei("10", "ether");

        await config.flightSuretyApp.registerAirline(airline2, { from: config.owner });

        let result = await config.flightSuretyData.isAirlineOperational.call(airline2);
        assert.equal(result, false, "Airline is not operational");

        await config.flightSuretyApp.fund({ from: airline2, value: fundAmount });

        result = await config.flightSuretyData.isAirlineOperational.call(airline2);
        assert.equal(result, true, "Airline is operational");
      });
});
