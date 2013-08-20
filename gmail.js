var inbox = require('inbox');
var util = require('util');


module.exports = function(options, callback) {

	if (!options) throw new Error('Please provide connection parameters');
	if (!options.email) throw new Error('Please provide an email address');

	var email = options.email;
	var auth  = {};
	
	if(options.accessToken){
		auth.XOAuth2 = {
            getToken:function(cb) {

            	var authData = [ "user=" + email, "auth=Bearer " + options.accessToken, "", ""];
            	var token = new Buffer(authData.join("\x01"), "utf-8").toString("base64");
            	process.nextTick(function() { cb(null, token) });
            }
        }
	}else if(options.passwords){
		auth.user = email;
		auth.pass = options.passwords;
	}else
		throw new Error('Please provide a password or an accessToken');
	
	
	options.auth = auth;
	options.secureConnection = true;
    var client = inbox.createConnection(false, "imap.gmail.com", options);
    
    client.connect();
	client.on("connect", function(){
      	callback(null, client);
  	});

	return client;
};


