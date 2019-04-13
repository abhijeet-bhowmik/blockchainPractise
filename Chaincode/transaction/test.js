let Chaincode = require("./transaction-contract.js");
let fms = require("@theledger/fabric-mock-stub");
let chai = require("chai");
let expect = require("chai").expect;
let should = require("chai").should();
let globalTemp = "";
let globalTempAdmin = "";


//import { ChaincodeMockStub, Transform } from "@theledger/fabric-mock-stub";

let ChaincodeMockStub = fms.ChaincodeMockStub; 
const chaincode = new Chaincode();
const mockStub = new ChaincodeMockStub("transaction_chaincode", chaincode);



console.log(mockStub);



describe('Test Transaction Chaincode', () => {
 
    it("Should init without issues", async () => {
        
 		const response = await mockStub.mockInit("testTxn1", []);
 		expect(response.status).to.eql(200);
    });
});



describe("Test Bank.createAccount function Invoke", () => {
	it("Should Transact unsuccessfully", async() => {

		let transfer = {
			"from": globalTempAdmin,
			"to": globalTemp,
			"amount": {
				"KHOKHA": 1000,
				"PETTI": 1000
			}
		}
		
 		const response = await mockStub.mockInvoke("testTxn1", ["transact", JSON.stringify(transfer)]);
 		
 		expect(response.status).to.eql(500);
	});

})