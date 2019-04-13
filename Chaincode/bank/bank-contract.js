const shim = require('fabric-shim');
const util = require('util');
const nanoID = require('nanoid/generate');
const moment = require('moment');
const ClientIdentity = require('fabric-shim').ClientIdentity;

let Bank = class {
        Init(stub) {
                let cid = new ClientIdentity(stub);
                
                if (process.env.NODE_ENV === "development" && cid.getMSPID() !== "NewputMSP") {
                    let err = {
                        "message": "Only Newput-Peer can call this function."
                    }
                    return shim.error(this.errorWrapper(err));
                }


                this.accountState = {
                        "ACTIVE": "ACTIVE",
                        "INACTIVE": "INACTIVE",
                        "LOCKED": "LOCKED",
                        "SUSPENDED": "SUSPENDED"
                 };
                this.currency = "INR";
                this.creator = cid.getMSPID();
                this.creatorCert = cid.getX509Certificate();
                

                const init_time = moment().format();
                console.info("Bank Chaincode instantiation successful at " + init_time);
                let ret = stub.getFunctionAndParameters();
                console.info(ret);
                
                let account = {
                                "accountNumber": nanoID('1234567890', 14),
                                "accountFingerPrint": this.creatorCert.fingerPrint,
                                "accountHolder": this.creatorCert.subject.commonName,
                                "accountBalance": 9999999999,
                                "accountCurrency": this.currency,
                                "isBankAdmin": true,
                                "accountStatus": this.accountState.ACTIVE
                        };


                let accountBuffer = Buffer.from(JSON.stringify(account));

                return stub.putState(account.accountNumber, accountBuffer).then(() => {
                                console.info("Account created successfully : " + account.accountNumber );
                                
                        return shim.success(this.responseWrapper(account));
                        }, () => {
                                return shim.error(this.errorWrapper("Error while creating account. Aborting..."));
                        });

        }

        Invoke(stub) {

                console.log("********** bank_chaincode | version:4 ***********")
                let cid = new ClientIdentity(stub);


                let ret = stub.getFunctionAndParameters();
                const invoker = cid.getX509Certificate();
                console.log("Invoke called : ");
                console.info(ret);

                switch(ret.fcn) {
                        case "instantiateForeignOrgAttributes":
                            if (cid.getMSPID() !== "NewputMSP") {
                                if (this.creator) {
                                    let err = {
                                        "message": `Hello ${cid.getMSPID()}. Your instance already set. So relax`,
                                        "statusCode": 400
                                    }
                                    return shim.error(this.errorWrapper(err));
                                }
                                this.accountState = {
                                    "ACTIVE": "ACTIVE",
                                    "INACTIVE": "INACTIVE",
                                    "LOCKED": "LOCKED",
                                    "SUSPENDED": "SUSPENDED"
                                };
                                this.currency = "INR";
                                this.creator = cid.getMSPID();
                                this.creatorCert = cid.getX509Certificate();
                                let updation = {
                                    "accountState": this.accountState,
                                    "currency": this.currency,
                                    "creator": this.creator,
                                    "creatorCert": this.creatorCert
                                };
                                return shim.success(this.responseWrapper(updation));
                            } else {
                                let err = {
                                    "message": "Hello Newput. Your instances are already set. So relax.",
                                    "statusCode": 400
                                }
                                return shim.error(this.errorWrapper(err));
                            }
                            
                            break;
                        case "createAccount":
                            
                            return this.createAccount(stub, ret.params, invoker).then((response) => {
                                return shim.success(this.responseWrapper(response));
                            }).catch((err) => {
                                return shim.error(this.errorWrapper(err));
                            });
                            
                            break;
                        case "getAccount": 
                            return this.getAccount(stub, ret.params, invoker).then((response) => {
                                return shim.success(this.responseWrapper(response));
                            }).catch((err) => {
                                return shim.error(this.errorWrapper(err));
                            });
                            break;
                        case "transfer": 
                            return this.transfer(stub, ret.params).then((response) => {
                                return shim.success(this.responseWrapper(response));
                            }).catch((err) => {
                                return shim.error(this.errorWrapper(err));
                            });
                            break;
                        case "getChaincodeVersion":
                            let response = {
                                "version": "v7"
                            }
                            return shim.success(this.responseWrapper(response));
                            break;
                        // case "fetchAccounts": return this.fetchAccounts(stub, ret.params).then((response) => {
                        //                                                 return response;
                        //                                         }).catch(function(err) {
                        //                                                 return err;
                        //                                         });
                        //                                         break;

                        default:
                            let err =
                                {
                                    "success": false,
                                    "statusCode": 400,
                                    "message": `Function ${ret.fcn} not valid. Avaliable functions are ["createAccount", "getAccount", "transfer", "instantiateForeignOrgAttributes, "getChaincodeVersion"]`
                                } 
                            return shim.error(this.errorWrapper(err));
                            break;
                };
                

        }



        getAccount(stub, params, invoker) {
            return new Promise((resolve, reject) => {
                this.paramValidator(params, 1).then(() => {
                    stub.getState(params[0]).then((account) => {
                        if (account === undefined) {
                            let err = {
                                "success": false,
                                "statusCode": 404,
                                "message": "Account not found."
                            }
                            return reject(err);
                        } else {
                            if (account.toString().length === 0) {
                                let err = {
                                    "success": false,
                                    "statusCode": 404,
                                    "message": "Account not found."
                                }
                                return reject(err);
                            }
                            let transformedAccount = JSON.parse(account.toString());
                            if (transformedAccount.accountFingerPrint !== invoker.fingerPrint) {
                                let err = {
                                    "success": false,
                                    "statusCode": 401,
                                    "message": "Finger-Print mismatch. Unauthorized access."
                                }
                                return reject(err);
                            }
                            
                            return resolve(transformedAccount);
                        }
                    })
                }).catch((err) => {
                    return reject(shim.error(this.errorWrapper(err)));
                });
            });
        }

        createAccount(stub, params, invoker) {
            return new Promise((resolve, reject) => {
                this.paramValidator(params, 0).then(() => {

                        let account = {
                                "accountNumber": nanoID('1234567890', 14),
                                "accountFingerPrint": invoker.fingerPrint,
                                "accountHolder": invoker.subject.commonName,
                                "accountBalance": 0,
                                "accountCurrency": this.currency,
                                "accountStatus": this.accountState.ACTIVE
                        };


                        let accountBuffer = Buffer.from(JSON.stringify(account));

                        stub.putState(account.accountNumber, accountBuffer).then(() => {
                                        console.info("Account created successfully : " + account.accountNumber );
                                        
                                return resolve(account);
                                }, () => {
                                    let err = {
                                        "message": "Error while creating account. Aborting...",
                                        "statusCode": 500
                                    }
                                    return reject(err);
                                });


                }).catch((err) => {
                    return reject(shim.error(this.errorWrapper(err)));
                });
            });
        }


        transfer(stub, params) {
            return new Promise((resolve, reject) => {
                this.paramValidator(params, 1).then(() => {
                    let transferDetail = JSON.parse(params[0]);
                    
                    this.validateTransfer(stub, transferDetail).then((account) => {
                            
                            let senderAccBuffer = Buffer.from(JSON.stringify(account.senderAcc));
                            let receiverAccBuffer = Buffer.from(JSON.stringify(account.receiverAcc));
                            stub.putState(account.senderAcc.accountNumber, senderAccBuffer).then(() => {
                                stub.putState(account.receiverAcc.accountNumber, receiverAccBuffer).then(() => {
                                    let response = {
                                        "success": true,
                                        "statusCode": 200,
                                        "transferDetails" : account
                                    }
                                    return resolve(response);
                                }, () => {
                                        let err = {
                                            "message": "Error while transacting on sender's account. Aborting...",
                                            "statusCode": 500
                                        }
                                        return reject(err);
                                });      
                            }, () => {
                                let err = {
                                    "message": "Error while transacting on receiver's account. Aborting...",
                                    "statusCode": 500
                                }
                                return reject(err);
                            });
                        }).catch((err) => {
                            return reject(err); 
                        });
                        


                }).catch((err) => {
                    return reject(shim.error(this.errorWrapper(err)));
                }); 
            })
        }

        fetchAccounts(stub, params) {
            return new Promise((resolve, reject) => {
                this.paramValidator(params, 1).then(() => {
                    let query = {};
	        		query = params[0];
	        		console.log("Received query : ")
	        		console.log(query);
	        		
	        		let transformedQuery = JSON.stringify({
	        			"selector": JSON.parse(query)
	        		});

	        		stub.getQueryResult(transformedQuery).then((value) => {
                        
                        let response = [];
                        let result = value.response.results;
	        			for (let i = 0; i < result.length; i++) {
                            try {
                                response[i] = JSON.parse(result[i].resultBytes.buffer.toString());
                            } catch(exception) {
                                console.log(i);
                                response[i] = result[i].resultBytes.buffer.toString();
                            }
	        				
	        			}


	        			
	                	return resolve(response);
	        		}, () => {
                        let err = {
                            "message": "Error while getQueryResult",
                            "statusCode": 500
                        }
	        			return reject(err);
	        		});
                }).catch((err) => {
                    return reject(err);
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





        validateTransfer(stub, transferDetail) {
            return new Promise((resolve, reject) => {
                if (!transferDetail.from || !transferDetail.to || !transferDetail.amount || (transferDetail.amount < 0)) {
                    let err = {
                        "success": false,
                        "statusCode": 400,
                        "message": "Invalid transfer."
                    };
                    return reject(err);
                }

                let cid = new ClientIdentity(stub);
                let invoker = cid.getX509Certificate();

                stub.getState(transferDetail.from)
                .then((fromAcc) => {
                    if (fromAcc === undefined) {
                        let err = {
                            "success": false,
                            "statusCode": 404,
                            "message": "Sender account not found."
                        }
                        return reject(err);
                    } else {
                        if (fromAcc.toString().length === 0) {
                            let err = {
                                "success": false,
                                "statusCode": 404,
                                "message": "Sender account not found."
                            }
                            return reject(err);
                        } else {
                            let senderAcc = JSON.parse(fromAcc.toString());

                            if (senderAcc.accountFingerPrint !== invoker.fingerPrint) {
                                let err = {
                                    "success": false,
                                    "statusCode": 401,
                                    "message": "Finger-Print mismatch. Unauthorized transaction."
                                }
                                return reject(err);
                            }

                            

                            if (senderAcc.accountBalance < transferDetail.amount) {
                                let err = {
                                    "success": false,
                                    "statusCode": 403,
                                    "message": "Insufficient Funds."
                                }
                                return reject(err);
                            }

                            if (senderAcc.accountStatus !== "ACTIVE") {
                                let err = {
                                    "success": false,
                                    "statusCode": 403,
                                    "message": "Sender account inactive. Cannot send funds."
                                }
                                return reject(err);
                            }

                            stub.getState(transferDetail.to)
                            .then((toAcc) => {
                                if (toAcc === undefined) {
                                    let err = {
                                        "success": false,
                                        "statusCode": 404,
                                        "message": "Receiver account not found."
                                    }
                                    return reject(err);
                                } else {
                                    if (toAcc.toString().length === 0) {
                                        let err = {
                                            "success": false,
                                            "statusCode": 404,
                                            "message": "Receiver account not found."
                                        }
                                        return reject(err);
                                    }

                                    let receiverAcc = JSON.parse(toAcc.toString());

                                    if (receiverAcc.accountStatus !== "ACTIVE") {
                                        let err = {
                                            "success": false,
                                            "statusCode": 403,
                                            "message": "Receiver account inactive. Cannot receive funds."
                                        }
                                        return reject(err);
                                    }
                                    // trasferring money here
                                    // debiting from sender account
                                    senderAcc.accountBalance = senderAcc.accountBalance - transferDetail.amount;
                                    // crediting to receiver account
                                    receiverAcc.accountBalance = receiverAcc.accountBalance + transferDetail.amount;
                                    
                                    return resolve({"senderAcc": senderAcc, "receiverAcc": receiverAcc});
                                }
                            });
                            
                            
                        }
                        
                    }
                        
                });

            });
        }


        errorWrapper(err) {
                
                console.error('\x1b[31m%s\x1b[1m', "Responding with error : ");
                console.log(err);
                console.log("\x1b[0m","\n\n");

                return Buffer.from(JSON.stringify(err));
        }

        responseWrapper(res) {
                console.log('\x1b[32m%s\x1b[1m', "Responding with success : ");
                console.log(res);
                console.log("\x1b[0m","\n\n");
                return Buffer.from(JSON.stringify(res));
        }


}


if (process.env.NODE_ENV === "development") {
    shim.start(new Bank());
} else {
    module.exports = Bank;
}
