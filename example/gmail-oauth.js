
var util 				= require('util');
var querystring = require('querystring');
var url  				= require('url');
var express		= require('express');

var app = express();
app.use(express.cookieParser());
app.use(express.session({ secret: "skjghskdjfhbqigohqdiouk" }));
app.listen(8082);

//
var GmailConnectionFactory = require('../GmailConnectionFactory').GmailConnectionFactory;
var gmailConnectionFactory = new GmailConnectionFactory({
  consumer_key:   'consumer_key',
  consumer_secret:'consumer_secret',
  callback_url:'http://localhost:8082/authentication/callback',
})

//Must be used, because we don't get the email from OAuth 1.0
var user_email = 'xxx@gmail.com'

app.all('/authentication', function(req, res){
	
	console.log('/authentication - called');
	
	var callback = 'http://localhost:8082/authentication/callback';
	var callbackUrl = url.parse(callback);
	callback = url.format(callbackUrl);
	
	var state = JSON.stringify({
		callback:callback
	})
	
	gmailConnectionFactory.getOAuthAuthorizeTokenURL( function(err, redirecUrl, oauth_token_secret) {
		if(err) return res.send(500, err);
	  return res.redirect(redirecUrl);
	});
});

app.all('/authentication/callback', function(req, res){
		
	console.log('/authentication/callback - called');
	
	gmailConnectionFactory.getOAuthAccessToken(req.query, function(err, oauth_token, oauth_token_secret) {
		
		if(err) return res.send(err, 500);
		
		var email = req.session.o
		gmailConnectionFactory.createConnection({
		  oauth_token:oauth_token,
			oauth_token_secret:oauth_token_secret,
			email:user_email,
		},function(err, connection) {
		  
		  if(err) return res.send(err, 500);
		  
		  //Latest email
		  connection.getMail(1,function(err, mail) {
        if(err) return res.send(err, 500);
        return res.send(mail, 200);
  		})

		})
	});
});




