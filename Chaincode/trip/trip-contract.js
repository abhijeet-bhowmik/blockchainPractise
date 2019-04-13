const shim = require('fabric-shim');
const util = require('util');
const nanoID = require('nanoid/generate');
const moment = require('moment');
const ClientIdentity = require('fabric-shim').ClientIdentity;

let Trip = class {


	Init(stub) {

		let init_time = moment().format()
		console.info("Chaincode instantiation successful at " + init_time);
		let ret = stub.getFunctionAndParameters();
		console.info(ret);
		let successObj = {
			"success": true,
			"statusCode": 200,
			"init_time": init_time
		}

		return shim.success(this.responseWrapper(successObj));
	}

	Invoke(stub) {
		if (!this.initialized) {
			this.attributeInitializer();
		}
		let cid = new ClientIdentity(stub);
		
		let ret = stub.getFunctionAndParameters();
		const invoker = cid.getMSPID();
		console.log("Invoke called : ");
		console.info(ret);

		switch(ret.fcn) {
			case "createTrip": 
				return this.createTrip(stub, ret.params, invoker).then((response) => {
					return shim.success(this.responseWrapper(response));
				}).catch((err) => {
					return shim.error(this.errorWrapper(err));
				});
				break;
			case "getTripStatus": 
				return this.getTripStatus(stub, ret.params).then((response) => {
					return shim.success(this.responseWrapper(response));
				}).catch((err) => {
					
					return shim.error(this.errorWrapper(err));
				});
				break;
			case "changeTripStatus": 
				return this.changeTripStatus(stub, ret.params, invoker).then((response) => {
					return shim.success(this.responseWrapper(response));
				}).catch((err) => {
					return shim.error(this.errorWrapper(err));
				});
				break;
			case "payTrip": 
				return this.payTrip(stub, ret.params, invoker).then((response) => {
					return shim.success(this.responseWrapper(response));
				}).catch((err) => {
					return shim.error(this.errorWrapper(err));	
				});
				break;
			case "purchaseTrip": 
				return this.purchaseTrip(stub, ret.params, invoker).then((response) => {
					return shim.success(this.responseWrapper(response));
				}).catch((err) => {
					return shim.error(this.errorWrapper(err));
				});
				break;
			case "queryTheChain": 
				return this.queryTheChain(stub, ret.params, invoker).then((response) => {
					return shim.success(this.responseWrapper(response));
				}).catch((err) => {
					return shim.error(this.errorWrapper(err));
				});
				break;

			default:
				let err =
				{
					"success": false,
					"statusCode": 400,
					"message": `Function ${ret.fcn} not valid. Avaliable functions are ["createTrip", "getTripStatus", "changeTripStatus", "payTrip"]`
				} 
				return shim.error(this.errorWrapper(err));
						break;
		};
			

	}
	
	attributeInitializer() {
		if (this.initialized) {
			return;
		}
		this.validTripProperties = ["from", "to", "cost", "sellerID", "tripID", "timeOfCreation"];
		this.enumStatus = {
			"BOOKED": "BOOKED",
			"LOCKED": "LOCKED",
			"FLOWN": "FLOWN",
			"LANDED": "LANDED",
			"COMPLETE": "COMPLETE",
			"CANCELED": "CANCELED"
		}; 

		this.statusMatrix = {
			"BOOKED" : {
				"LOCKED": 1,
				"FLOWN": 0,
				"LANDED": 0,
				"COMPLETE": 0,
				"CANCELED": 1
			},
			"LOCKED": {
				"BOOKED": 0,
				"FLOWN": 1,
				"LANDED": 0,
				"COMPLETE": 0,
				"CANCELED": 1
			},
			"FLOWN": {
				"BOOKED": 0,
				"LOCKED": 0,
				"LANDED": 1,
				"COMPLETE": 0,
				"CANCELED": 0
			},
			"LANDED": {
				"BOOKED": 0,
				"LOCKED": 0,
				"FLOWN": 0,
				"COMPLETE": 1,
				"CANCELED": 0
			},
			"COMPLETE": {
				"BOOKED": 0,
				"LOCKED": 0,
				"FLOWN": 0,
				"LANDED": 0,
				"CANCELED": 0
			},
			"CANCELED": {
				"BOOKED": 1,
				"LOCKED": 0,
				"FLOWN": 0,
				"LANDED": 0,
				"COMPLETE": 0,
			}
		}

		this.payableState = ["LOCKED", "FLOWN", "LANDED", "COMPLETE"];
		this.initialized = true;
		return;
	}

	createTrip(stub, params) {

		return new Promise((resolve, reject) => {

			if (params.length === 0) {
				let err =
					{
						"success": false,
						"statusCode": 400,
						"message": "Invalid arguments. No arguments received."
					}
				return reject(err);
			} else if (params.length != 1) {
				let err =
					{
						"success": false,
						"statusCode": 400,
						"message": "Invalid arguments. Expected 1, got " + params.length + "."
					}
				return reject(err);
			} else {
				
				let trip = {};
				trip = JSON.parse(params[0]);
				console.log("Received trip query for trip : ")
				console.log(trip);
				
				for (let i = 0; i < this.validTripProperties.length ; i++){
					if (Object.keys(trip).indexOf(this.validTripProperties[i]) < 0) {
						console.log("Property not found " + this.validTripProperties[i]);
						let err = {
							"message": "Invalid trip object. Property not found " + this.validTripProperties[i],
							"statusCode": 400
						}
						return reject(err);
					}
				}
				
				
				trip.status = this.enumStatus.BOOKED;
				trip.paid = 0;

				let tripBuffer = Buffer.from(JSON.stringify(trip));
				
				
				stub.putState(trip.tripID, tripBuffer).then(() => {
					console.info("Trip created successfully : " + trip.ID );
					
					return resolve(trip);
				}, () => {
					let err = {
						"message": "Error while creating trip. Aborting...",
						"status": "500"
					}
					return reject(err);
				});

			}
		})

	}

	purchaseTrip(stub, params) {
		return new Promise((resolve, reject)=> {
			if (params.length === 0) {
				let err =
					{
						"success": false,
						"statusCode": 400,
						"message": "Invalid arguments. No arguments received."
					}
				return reject(err);
			} else if (params.length != 2) {
				let err =
					{
						"success": false,
						"statusCode": 400,
						"message": "Invalid arguments. Expected 2, got " + params.length + "."
					}
				return reject(err);
			} else {

				let trip = {};
				let tripID = params[0];
				let buyerID = params[1];

				stub.getState(tripID)
				.then((value) => {
					if (value === undefined) {
						let err = {
							"success": false,
							"statusCode": 404,
							"message": "Record not found."
						}
						return reject(shim.error(this.errorWrapper(err)));
					} else {
						if (value.toString().length === 0) {
							let err = {
								"success": false,
								"statusCode": 404,
								"message": "Record not found."
							}
							return reject(shim.error(this.errorWrapper(err)));
						} else {
							let trip = JSON.parse(value.toString());

							if (trip.status !== "BOOKED") {
								let err = {
									"success": false,
									"statusCode": 400,
									"message": `Cannot purchase a trip when it is ${trip.status}.`
								}
								return reject(shim.error(this.errorWrapper(err)));
							}
							if (trip.purchased === 1) {
								let err = {
									"success": false,
									"statusCode": 400,
									"message": `Cannot purchase the trip. Already purchased.`
								}
								return reject(shim.error(this.errorWrapper(err)));
							}


							const cid = new ClientIdentity(stub);


							trip.buyerID = buyerID; 
							trip.purchased = 1;
							// will introduce chaincode invocation here which will check purchaser balance
							let tripBuffer = Buffer.from(JSON.stringify(trip));
							stub.putState(trip.ID, tripBuffer).then(() => {
								console.info("Trip purchase requested for : " + trip.ID + " by : " + buyerID);
								
								return resolve(trip);
							}, () => {
								let err = {
									"success": false,
									"statusCode": 500,
									"message": "Error while purchasing trip. Aborting...."
								}
								return reject(err);
							});
						}
							
					}
						
				});

			}
		})
	}


	changeTripStatus(stub, params, invoker) {
		// define in later version
		return new Promise((resolve, reject) => {

			if (params.length === 0) {
				let err =
					{
						"success": false,
						"statusCode": 400,
						"message": "Invalid arguments. No arguments received."
					}
				return reject(err);
			} else if (params.length !== 2) {
				let err =
					{
						"success": false,
						"statusCode": 400,
						"message": "Invalid arguments. Expected 2, got " + params.length + "."
					}
				return reject(err);
			} else {

				let trip = {};
				let tripID = params[0];
				let status = params[1];
				

				if (Object.keys(this.enumStatus).indexOf(status) < 0) {
					let err = {
						"success": false,
						"statusCode": 400,
						"message": "Invalid status."
					}
					return reject(err);
				}



				stub.getState(tripID)
				.then((value) => {
					if (value === undefined) {
						let err = {
							"success": false,
							"statusCode": 404,
							"message": "Record not found."
						}
						return reject(err);
					} else {
						if (value.toString().length === 0) {
							let err = {
								"success": false,
								"statusCode": 404,
								"message": "Record not found."
							}
							return reject(err);
						} else {
							let trip = JSON.parse(value.toString());

							if (this.statusMatrix[trip.status][status] !== 1) {
								let err = {
									"success": false,
									"statusCode": 400,
									"message": `Invalid status change. Cannot change from ${trip.status} to ${status}.`
								}
								return reject(err);
							}
							
							trip.status = status;
							
							let tripBuffer = Buffer.from(JSON.stringify(trip));
							stub.putState(trip.ID, tripBuffer).then(() => {
								console.info("Trip status updation submitted successfully : " + trip.ID );
								
								return resolve(trip);
							}, () => {
								let err = {
									"message": "Error while updating trip. Aborting...",
									"statusCode": 500
								}
								return reject(err);
							});
						}
						
					}
						
				});

			}
		})
	}

	// payTrip(stub, params) {
	// 		// define in later version
	// 		return new Promise((resolve, reject) => {
	// 			if (params.length === 0) {
	//     		let err =
	//         		{
	// 	        		"success": false,
	// 	        		"statusCode": 400,
	// 	        		"message": "Invalid arguments. No arguments received."
	//         		}
	//     		return reject(err);
	//     	} else if (params.length !== 1) {
	//     		let err =
	//         		{
	// 	        		"success": false,
	// 	        		"statusCode": 400,
	// 	        		"message": "Invalid arguments. Expected 1, got " + params.length + "."
	//         		}
	//     		return reject(err);
	//     	} else {


	//     		let trip = {};
	//     		let tripID = params[0];
				

	//     		stub.getState(tripID)
	//             .then((value) => {
	//             		if (value === undefined) {
	//             			let err = {
	//             				"success": false,
	// 			        		"statusCode": 404,
	// 			        		"message": "Record not found."
	//             			}
	//             			return reject(shim.error(this.errorWrapper(err)));
	//             		} else {
	//             			if (value.toString().length === 0) {
	//             				let err = {
	//                 				"success": false,
	// 				        		"statusCode": 404,
	// 				        		"message": "Record not found."
	//             				}
	//             				return reject(shim.error(this.errorWrapper(err)));
	//             			} else {
	//             				let trip = JSON.parse(value.toString());

	//             				if (this.payableState.indexOf(trip.status) < 0) {
	//             					let err = {
	// 	                				"success": false,
	// 					        		"statusCode": 400,
	// 					        		"message": "Cannot pay an trip while it has status : " + trip.status
	//                 				}
	//                 				return reject(shim.error(this.errorWrapper(err)));
	//             				}

	//             				if (trip.paid === 1) {
	//             					let err = {
	// 	                				"success": false,
	// 					        		"statusCode": 400,
	// 					        		"message": "Cannot pay already paid trip "
	//                 				}
	//                 				return reject(shim.error(this.errorWrapper(err)));
	//             				}

	//             				trip.paid = 1
	//             				trip.updatedAt = moment().format();
	//             				let tripBuffer = Buffer.from(JSON.stringify(trip));
	//             				stub.putState(trip.ID, tripBuffer).then(() => {
	// 			        			console.info("Trip status updated successfully : " + trip.ID );
									
	// 			                	return resolve(shim.success(this.responseWrapper(trip)));
	// 			        		}, () => {
	// 			        			return reject(shim.error(this.errorWrapper("Error while updating trip. Aborting...")));
	// 			        		});
								
	//             			}
							
	//             		}
						
	//             });
	//     	}
	// 		})
	// }

	getTripStatus(stub, params) {
		return new Promise((resolve, reject) => {
			if (params.length === 0) {
				let err =
					{
						"success": false,
						"statusCode": 400,
						"message": "Invalid arguments. No arguments received."
					}
				return reject(err);
			} else if (params.length != 1) {
				let err =
					{
						"success": false,
						"statusCode": 400,
						"message": "Invalid arguments. Expected 1, got " + params.length + "."
					}
				return reject(err);
			} else {
				let tripID = params[0];
				
				return stub.getState(tripID)
				.then((value) => {
					if (value === undefined) {
						let err = {
							"success": false,
							"statusCode": 404,
							"message": "Record not found."
						}
						return reject(err);
					} else {
						if (value.toString().length === 0) {
							let err = {
								"success": false,
								"statusCode": 404,
								"message": "Record not found."
							}
							return reject(err);
						} else {
							let trip = JSON.parse(value.toString());
							let resp = {
								"status": 200,
								"response": trip.status
							}
							return resolve(resp);
						}
						
					}
						
				});

			}
		});
	}

	// queryTheChain(stub, params, invoker) {
	// 	return new Promise((resolve, reject) => {

	//     	if (params.length === 0) {
	//     		let err =
	//         		{
	// 	        		"success": false,
	// 	        		"statusCode": 400,
	// 	        		"message": "Invalid arguments. No arguments received."
	//         		}
	//     		return reject(shim.error(this.errorWrapper(err)));
	//     	} else if (params.length != 1) {
	//     		let err =
	//         		{
	// 	        		"success": false,
	// 	        		"statusCode": 400,
	// 	        		"message": "Invalid arguments. Expected 1, got " + params.length + "."
	//         		}
	//     		return reject(shim.error(this.errorWrapper(err)));
	//     	} else {
	//     		let query = {};
	//     		query = params[0];
	//     		console.log("Received query : ")
	//     		console.log(query);
				
	//     		let transformedQuery = JSON.stringify({
	//     			"selector": JSON.parse(query)
	//     		});

	//     		stub.getQueryResult(transformedQuery).then((value) => {
	//     			console.info("Query fetched : ");
	//     			let response = [];
	//     			for (let i = 0; i < value.data.length; i++) {
	//     				response[i] = JSON.parse(value.data[i].value.toString())
	//     			}


					
	//             	return resolve(shim.success(this.responseWrapper(response)));
	//     		}, () => {
	//     			return reject(shim.error(this.errorWrapper("Error while creating trip. Aborting...")));
	//     		});

	//     	}
	// 	})
	// }

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


};

if (process.env.NODE_ENV === "development") {
    shim.start(new Trip());
} else {
    module.exports = Trip;
}



