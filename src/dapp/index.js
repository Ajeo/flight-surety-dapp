import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

const SERVER_URL = 'http://localhost:3000';

(async () => {
  let result = null;
  let contract = new Contract("localhost", () => {
    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error, result);
      display("Operational Status", "Check if contract is operational", [
        { label: "Operational Status", error: error, value: result },
      ]);
    });

    // User-submitted transaction
    DOM.elid("submit-oracle").addEventListener("click", () => {
      let flight = DOM.elid("flight-number").value;
      // Write transaction
      contract.fetchFlightStatus(flight, (error, result) => {
        display("Oracles", "Trigger oracles", [
          {
            label: "Fetch Flight Status",
            error: error,
            value: result.flight + " " + result.timestamp,
          },
        ]);
      });
    });

    const display = (title, description, results) => {
      let displayDiv = DOM.elid("display-wrapper");
      let section = DOM.section();
      section.appendChild(DOM.h2(title));
      section.appendChild(DOM.h5(description));
      results.map((result) => {
        let row = section.appendChild(DOM.div({ className: "row" }));
        row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
        row.appendChild(
          DOM.div(
            { className: "col-sm-8 field-value" },
            result.error ? String(result.error) : String(result.value)
          )
        );
        section.appendChild(row);
      });
      displayDiv.append(section);
    }
    
    const buyInsurance = (event) => {
      const flight = event.target.value;
      const amount = 1;
      console.log(flight);
    
      try {
        contract.buyInsurance(amount, (error, result) => {
          console.log("Insurance purchased with", amount);
          display('Oracles', 'Trigger oracles', [{ label: 'Assurance Detail', error: error, value: "Flight Name: " + flight + " | Assurance Paid: " + price + " ether" + " | Paid on Delay: " + price * 1.5 + " ether" }], "display-flight", "display-detail");
        });
      } catch (error) {
        console.log(error);
      }
    }
    
    const selectFlight = (event) => {
      DOM.elid("dropdownMenuLink").textContent = event.target.text;
      DOM.elid("flight-insurance").value = event.target.text;
    };
    
    const renderFlights = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/flights`);
        const json = await response.json();
    
        json.data.forEach(f => {
          const option = DOM.a(
            {
              className: `dropdown-item`,
              href: `#`,
            },
            f.name, 
          );
    
          option.addEventListener("click", selectFlight);
    
          DOM.elid("flights").appendChild(option);
        });
    
        DOM.elid("flight-insurance").addEventListener("click", buyInsurance);
      } catch (error) {
        console.log(error);
      }
    };

    // Render Connected Wallet Address in Navbar
    DOM.elid("connected-address").textContent = contract.owner;

    // Render flights
    renderFlights();
  });
})();