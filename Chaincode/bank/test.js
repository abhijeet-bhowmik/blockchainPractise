let Chaincode = require("./bank-contract.js");
let fms = require("@theledger/fabric-mock-stub");
let chai = require("chai");
let expect = require("chai").expect;
let should = require("chai").should();
let globalTemp = "";
let globalTempAdmin = "";

console.log("############# Environment ################");
console.log("             [" + process.env.NODE_ENV + "]             ");


//import { ChaincodeMockStub, Transform } from "@theledger/fabric-mock-stub";

let ChaincodeMockStub = fms.ChaincodeMockStub; 
const chaincode = new Chaincode();
const mockStub = new ChaincodeMockStub("BankStub", chaincode);


if (process.env.NODE_ENV === "testing") {
	describe('Test Bank Chaincode', () => {
 
		it("Should init without issues", async () => {
			
			 const response = await mockStub.mockInit("testTxn1", []);
			 globalTempAdmin = JSON.parse(response.payload.toString()).accountNumber;
			 expect(response.status).to.eql(200);
		});
	});
	
	
	describe("Test Bank.createAccount function Invoke", () => {
		it("Should create an account successfully", async() => {
			
			 const response = await mockStub.mockInvoke("testTxn1", ["createAccount"]);
			 globalTemp = JSON.parse(response.payload.toString()).accountNumber;
			 expect(response.status).to.eql(200);
		});
	
		it("Should return 500", async() => {
			
			 const response = await mockStub.mockInvoke("testTxn1", ["createAccount", "randomArg"]);
			 expect(response.status).to.eql(500);
		});
	
	})
	
	
	
	// describe("Test Bank.fetchAccounts function Invoke", () => {
	// 	it("Should fetch accounts successfully", async() => {
	// 		let query = {
	// 			"accountStatus": "ACTIVE"
	// 		}
	//  		const response = await mockStub.mockInvoke("testTxn1", ["fetchAccounts", JSON.stringify(query)]);
	// 		console.log(response); 
	// 		 expect(response.status).to.eql(200);
	// 	});
	
	
	// })
	
	describe("Test Bank.getAccount function Invoke", () => {
		it("Should fetch accounts successfully", async() => {
	
			 const response = await mockStub.mockInvoke("testTxn1", ["getAccount", globalTemp]);
			 expect(response.status).to.eql(200);
		});
	
	
	})
	
	
	
	
	describe("Test Bank.transfer function Invoke", () => {
		it("Should transfer funds successfully", async() => {
	
			let transfer = {
				"from": globalTempAdmin,
				"to": globalTemp,
				"amount": 10000
			}
			
			 const response = await mockStub.mockInvoke("testTxn1", ["transfer", JSON.stringify(transfer)]);
			 
			 expect(response.status).to.eql(200);
		});
	
		it("Should return 500", async() => {
	
			let transfer = {
				"to": globalTemp,
				"amount": 1000
			}
			
			 const response = await mockStub.mockInvoke("testTxn1", ["transfer", JSON.stringify(transfer)]);
			 expect(response.status).to.eql(500);
		});
	
		it("Should return 500", async() => {
	
			let transfer = {
				"from": "12345678901234",
				"to": globalTemp,
				"amount": 1000
			}
			
			 const response = await mockStub.mockInvoke("testTxn1", ["transfer", JSON.stringify(transfer)]);
			 expect(response.status).to.eql(500);
		});
	
	
		it("Should return 500", async() => {
	
			let transfer = {
				"from": globalTempAdmin,
				"to": "123039019092093",
				"amount": 1000
			}
			
			 const response = await mockStub.mockInvoke("testTxn1", ["transfer", JSON.stringify(transfer)]);
			 expect(response.status).to.eql(500);
		});
	
	
	
	
	});

	describe("Test Bank.instantiateForeignOrgAttributes function Invoke", () => {
		it("Should return 500", async() => {
	
			 const response = await mockStub.mockInvoke("testTxn1", ["instantiateForeignOrgAttributes"]);
			 expect(response.status).to.eql(500);
		});
	});

	describe("Test Bank.getChaincodeVersion function Invoke", () => {
		it("Should return chaincode version", async() => {
	
			 const response = await mockStub.mockInvoke("testTxn1", ["getChaincodeVersion"]);
			 expect(response.status).to.eql(200);
		});
	});
	
}


else if (process.env.NODE_ENV === "development") {
	describe('Test Bank Chaincode', () => {
 
		it("Should not init", async () => {
			
			 const response = await mockStub.mockInit("testTxn1", []);
			 expect(response.status).to.eql(500);
		});
	});


	describe("Test Bank.createAccount function Invoke", () => {
		it("Should not be able to create an account successfully", async() => {
			
			 const response = await mockStub.mockInvoke("testTxn1", ["createAccount"]);
			 expect(response.status).to.eql(500);
		});
	
	
	})



	describe("Test Bank.transfer function Invoke", () => {
		it("Should not transfer funds successfully", async() => {
	
			let transfer = {
				"from": globalTempAdmin,
				"to": globalTemp,
				"amount": 10000
			}
			
			 const response = await mockStub.mockInvoke("testTxn1", ["transfer", JSON.stringify(transfer)]);
			 
			 expect(response.status).to.eql(500);
		});
	
	});


	describe("Test Bank.getAccount function Invoke", () => {
		it("Should not fetch accounts successfully", async() => {
	
			 const response = await mockStub.mockInvoke("testTxn1", ["getAccount", globalTemp]);
			 expect(response.status).to.eql(500);
		});
	});

	describe("Test Bank.instantiateForeignOrgAttributes function Invoke", () => {
		it("Should return 500", async() => {
	
			 const response = await mockStub.mockInvoke("testTxn1", ["instantiateForeignOrgAttributes"]);
			 expect(response.status).to.eql(200);
		});
	});

	describe("Test Bank.getChaincodeVersion function Invoke", () => {
		it("Should return chaincode version", async() => {
	
			 const response = await mockStub.mockInvoke("testTxn1", ["getChaincodeVersion"]);
			 expect(response.status).to.eql(200);
		});
	});

} else {
	console.log("Please specify environment....")
	process.exit();
}





















