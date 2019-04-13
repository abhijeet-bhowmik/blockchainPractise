const shim = require('fabric-shim');
const util = require('util');
const nanoID = require('nanoid/generate');
const moment = require('moment');
const ClientIdentity = require('fabric-shim').ClientIdentity;


let Transaction = class {
	Init(stub) {
        let cid = new ClientIdentity(stub);
        
        this.status = {
        	"SUCCESS": "SUCCESS",
        	"FAILED": "FAILED",
        	"UNAUTHORIZED": "UNAUTHORIZED"
        }
         
        this.creator = cid.getMSPID;
        this.creatorCert = cid.getX509Certificate();

        const init_time = moment().format();
        console.info("Transaction Chaincode instantiation successful at " + init_time);
        
       	
       	return shim.success();
                
    }



    Invoke(stub) {
                
        let cid = new ClientIdentity(stub);
        let ret = stub.getFunctionAndParameters();
        const invoker = cid.getX509Certificate();
        console.log("Invoke called : ");
        console.info(ret);

        switch(ret.fcn) {
            case "transact": 
            	return this.transact(stub, ret.params, invoker).then((response) => {
                    return response;
                }).catch(function(err) {
                    return err;
                });
                break;
           

            default:
                let err =
                    {
                        "success": false,
                        "statusCode": 400,
                        "message": `Function ${ret.fcn} not valid. Avaliable functions are ["transact"]`
                    } 
                return shim.error(this.errorWrapper(err));
                break;
        };
                

    }

    transact(stub, params, invoker) {
    	return new Promise((resolve, reject) => {
            this.paramValidator(params, 1).then(() => {
                let args = ["transfer", params[0]];
                console.log(args);
                stub.invokeChaincode("bank_contract", args, "primarychannel").then((response) => {
                    // transaction successful
                    let transaction = {
                        "transactionID": "TRANS-" + nanoID('1234567890', 14),
                        "timeStamp": moment().format(),
                        "transactor": invoker,
                        "transactionRequestPayload": JSON.parse(params[0]),
                        "transactionResponsePayload": response            
                    }
                    let transactionBuffer = Buffer.from(JSON.stringify(transaction));
    
                    stub.putState(transaction.transactionID, transactionBuffer).then(() => {
                        console.info("Transaction created successfully : " + transaction.transactionID);
                        return resolve(shim.success(this.responseWrapper(transaction)));
                    }, () => {
                        return reject(shim.error(this.errorWrapper("Error while creating account. Aborting...")));
                    });
    
    
                }).catch((err) => {
                    // transaction failed
                    let transaction = {
                        "transactionID": "TRANS-" + nanoID('1234567890', 14),
                        "timeStamp": moment().format(),
                        "transactor": invoker,
                        "transactionRequestPayload": JSON.parse(params[0]),
                        "transactionResponsePayload": err,
                        "transactionFailed": true           
                    }
                    let transactionBuffer = Buffer.from(JSON.stringify(transaction));
    
                    stub.putState(transaction.transactionID, transactionBuffer).then(() => {
                        console.info("Transaction creation Failed : " + transaction.transactionID);
                        return resolve(shim.error(this.errorWrapper(transaction)));
                    }, () => {
                        return reject(shim.error(this.errorWrapper("Error while creating account. Aborting...")));
                    });
                })
                
    
    
            }).catch((err) => {
                return reject(shim.error(this.errorWrapper(err)));
            });
        })
    }


    paramValidator(params, count) {
            
        return new Promise((resolve, reject) => {
            if (params.length === 0 && count != 0) {
                let err =
                    {
                        "success": false,
                        "statusCode": 400,
                        "message": "Invalid arguments. No arguments received."
                    }
                return reject(err);
            } else if (params.length !== count) {
                let err =
                    {
                        "success": false,
                        "statusCode": 400,
                        "message": `Invalid arguments. Expected ${count}, got ${params.length} .`
                    }
                return reject(err);
            } else {
                return resolve();
            }
        });
    }


    errorWrapper(err) {
        console.error('\x1b[31m%s\x1b[1m', "Responding with error : ");
        console.log(err);
        console.log("\n\n");

        return Buffer.from(JSON.stringify(err));
    }

    responseWrapper(res) {
        console.log('\x1b[32m%s\x1b[1m', "Responding with success : ");
        console.log(res);
        console.log("\n\n");
        return Buffer.from(JSON.stringify(res));
    }
}


shim.start(new Transaction());


// module.exports = Transaction;
