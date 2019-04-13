let Chaincode = require("./trip-contract.js");
let fms = require("@theledger/fabric-mock-stub");
let chai = require("chai");
let expect = require("chai").expect;
let should = require("chai").should();
let globalTemp = "";
const nanoID = require('nanoid/generate');
let testID = nanoID('1234567890', 14);
let moment = require("moment");
let testTOC = moment().format();


//import { ChaincodeMockStub, Transform } from "@theledger/fabric-mock-stub";

let ChaincodeMockStub = fms.ChaincodeMockStub; 
const chaincode = new Chaincode();
const mockStub = new ChaincodeMockStub("MockStub", chaincode);




describe('Test Trip Chaincode', () => {
 
    it("Should init without issues", async () => {
        
 		const response = await mockStub.mockInit("testTxn1", []);
 		expect(response.status).to.eql(200);
    });
});

describe("Test Trip.createTrip function Invoke", () => {
	it("Should create a trip successfully", async() => {
		let trip = {
			"tripID": testID,
			"timeOfCreation": testTOC,
			"from": "QATAR",
			"to": "DUBAI",
			"cost": "100000",
			"sellerID": 2
		}
		
 		const response = await mockStub.mockInvoke("testTxn1", ["createTrip", JSON.stringify(trip)]);
 		expect(response.status).to.eql(200);
	});

	it("#1 Should return 500", async() => {
		
		 const response = await mockStub.mockInvoke("testTxn1", ["createTrip", "{\"from\":\"QATAR\",\"to\":\"DUBAI\",\"cost\":\"$100\",\"buyerID\":\"1\",\"sellerID\":\"2\"}", "123"]);
		 console.log(response.payload.toString());
 		expect(response.status).to.eql(500);
	});

	it("#2 Should return 500", async() => {
		
 		const response = await mockStub.mockInvoke("testTxn1", ["createTrip"]);
 		expect(response.status).to.eql(500);
	})
})


describe("Test Trip.getTripStatus function Invoke", () => {
	it("Should not return a trip", async() => {
		
 		const response = await mockStub.mockInvoke("testTxn1", ["getTripStatus", "9BH0CAB98"]);
 		expect(response.status).to.eql(500);
	});

	it("Should return a trip successfully", async() => {
		
 		response = await mockStub.mockInvoke("testTxn1", ["getTripStatus", testID]);
		 expect(response.status).to.eql(200);
		 let transformedResponse = JSON.parse(response.payload.toString())
 		expect(transformedResponse.status).to.eql(200);
 		expect(transformedResponse.response).to.eql('BOOKED');

	});


})


// describe("Test Trip.payTrip function Invoke during BOOKED status", () => {
// 	it("Should return 500", async() => {
		
//  		const response = await mockStub.mockInvoke("testTxn1", ["payTrip", "9BH0CAB98"]);
//  		expect(response.status).to.eql(500);
// 	});

// 	it("Should return 500", async() => {
		
//  		const response = await mockStub.mockInvoke("testTxn1", ["payTrip", globalTemp, "COOKED"]);
//  		expect(response.status).to.eql(500);
// 	});

// 	it("Should pay trip successfully", async() => {
		
//  		response = await mockStub.mockInvoke("testTxn1", ["payTrip", globalTemp]);
//  		expect(response.status).to.eql(500);

// 	});

// 	it("Should return 500", async() => {
		
//  		response = await mockStub.mockInvoke("testTxn1", ["payTrip", globalTemp]);
//  		expect(response.status).to.eql(500);
 		

// 	});


// })


// describe("Test Trip.purchaseTrip function Invoke during LOCKED status", () => {
// 	it("Should return 500", async() => {
		
//  		const response = await mockStub.mockInvoke("testTxn1", ["purchaseTrip", "9BH0CAB98"]);
//  		expect(response.status).to.eql(500);
// 	});

// 	it("Should return 500", async() => {
		
//  		const response = await mockStub.mockInvoke("testTxn1", ["purchaseTrip", testID, "COOKED"]);
//  		expect(response.status).to.eql(500);
// 	});

// 	it("Should purchase trip successfully", async() => {
		
//  		response = await mockStub.mockInvoke("testTxn1", ["purchaseTrip", testID]);
//  		expect(response.status).to.eql(200);

// 	});

// 	it("Should return 500", async() => {
		
//  		response = await mockStub.mockInvoke("testTxn1", ["purchaseTrip", testID]);
//  		expect(response.status).to.eql(500);
 		

// 	});


// })


describe("Test Trip.changeTripStatus function Invoke", () => {
	it("Should return 500", async() => {
		
 		const response = await mockStub.mockInvoke("testTxn1", ["changeTripStatus", "9BH0CAB98", "BOOKED"]);
 		expect(response.status).to.eql(500);
	});

	it("Should return 500", async() => {
		
 		const response = await mockStub.mockInvoke("testTxn1", ["changeTripStatus", testID, "COOKED"]);
 		expect(response.status).to.eql(500);
	});

	it("Should change trip status successfully", async() => {
		
 		response = await mockStub.mockInvoke("testTxn1", ["changeTripStatus", testID, "LOCKED"]);
		 expect(response.status).to.eql(200);
		 let transformedResponse = JSON.parse(response.payload.toString());
 		expect(transformedResponse.status).to.eql('LOCKED');

	});

	it("Should not change trip status successfully", async() => {
		
 		response = await mockStub.mockInvoke("testTxn1", ["changeTripStatus", testID, "COMPLETE"]);
 		expect(response.status).to.eql(500);
 		

	});


})







// describe("Test Trip.payTrip function Invoke during LOCKED status", () => {
// 	it("Should return 500", async() => {
		
//  		const response = await mockStub.mockInvoke("testTxn1", ["payTrip", "9BH0CAB98"]);
//  		expect(response.status).to.eql(500);
// 	});

// 	it("Should return 500", async() => {
		
//  		const response = await mockStub.mockInvoke("testTxn1", ["payTrip", globalTemp, "COOKED"]);
//  		expect(response.status).to.eql(500);
// 	});

// 	it("Should pay trip successfully", async() => {
		
//  		response = await mockStub.mockInvoke("testTxn1", ["payTrip", globalTemp]);
//  		expect(response.status).to.eql(200);

// 	});

// 	it("Should return 500", async() => {
		
//  		response = await mockStub.mockInvoke("testTxn1", ["payTrip", globalTemp]);
//  		expect(response.status).to.eql(500);
 		

// 	});


// })

// describe("Test Trip.queryTheChain function Invoke", () => {
	

	

// 	it("Should fetch query result", async() => {

// 		let query = {
// 			"$and" : [
// 				{"status": "LOCKED"},
// 				{"paid":1}
// 			]
// 		}
		
//  		response = await mockStub.mockInvoke("testTxn1", ["queryTheChain", JSON.stringify(query) ]);
//  		expect(response.status).to.eql(200);

// 	});

	


// })







