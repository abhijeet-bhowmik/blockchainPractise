const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
 
// Connection URL
const url = 'mongodb://192.168.0.18/20:27017';
 
// Database Name
const dbName = 'myproject';
 




module.exports = function(dbName) {
    MongoClient.connect(url, function(err, client) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        console.log(client);
       
        const db = client.db(dbName);
      });
}