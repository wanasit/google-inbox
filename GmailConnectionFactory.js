exports.GmailConnectionFactory 	= GmailConnectionFactory;
exports.GmailConnection 	 			= GmailConnection;

var util   = require('util');
var rest = require('restler');
var oauth  = require('google-oauth');
var querystring = require('querystring');

var Base64 = require('./Base64');
var ImapConnectionFactory = require('./ImapConnectionFactory').ImapConnectionFactory;
var ImapConnection 				= require('./ImapConnectionFactory').ImapConnection;


util.inherits(GmailConnection, ImapConnection);

function GmailConnection(accountDetail){
	ImapConnection.call(this,accountDetail);
}

util.inherits(GmailConnectionFactory, ImapConnectionFactory);
function GmailConnectionFactory(setting) {
	
	setting = setting || {};
	setting.host = setting.host || 'imap.gmail.com';
	setting.port = setting.port || 993;
	setting.secure = true;
	ImapConnectionFactory.call(this,setting);
	
	this.oauth = new oauth.OAuth(
	  setting.consumer_key, 
	  setting.consumer_secret, 
	  setting.callback_url); 
}


GmailConnectionFactory.prototype.getOAuthAuthorizeTokenURL = function(callback) {
	
	this.oauth.getGoogleAuthorizeTokenURL(['https://mail.google.com/'], callback);
}

GmailConnectionFactory.prototype.getOAuthAccessToken = function(params, callback) {
	
	this.oauth.getGoogleAccessToken(params, callback);
}

GmailConnectionFactory.prototype.createConnection = function(accountDetail, callback) {
	
	if(accountDetail.password) this.createConnectionByPassword(accountDetail, callback);
	else this.createConnectionByAuthToken(accountDetail.email, accountDetail.oauth_token, accountDetail.oauth_token_secret, callback); 
}

GmailConnectionFactory.prototype.createConnectionByAuthToken = function(email, oauth_token, oauth_token_secret, callback) {
		
	var oAuth = this.oauth;
	var _params = oAuth._prepareParameters(oauth_token, oauth_token_secret, "GET", 'https://mail.google.com/mail/b/'+email+'/imap/', {});
	var params = {};
	
	_params.forEach(function(param,index) {
		params[percentEncode(param[0])] = percentEncode(param[1]);
	});

	var baseStringDecoded =  'GET https://mail.google.com/mail/b/'+email+'/imap/ '
		+'oauth_consumer_key="'+params.oauth_consumer_key+'",'
		+'oauth_nonce="'+params.oauth_nonce+'",'
		+'oauth_signature="'+params.oauth_signature+'",'
		+'oauth_signature_method="'+params.oauth_signature_method+'",'
		+'oauth_timestamp="'+params.oauth_timestamp+'",'
		+'oauth_token="'+params.oauth_token+'",'
		+'oauth_version="1.0"';

	var baseString = Base64.encode(baseStringDecoded);
	
	var imap = new GmailConnection({    
		host: 'imap.gmail.com',
    port: 993,
    secure: true,
    debug: true,
    xoauth: baseString
	});
	
	imap.connect(function(err) {

		if(err) return callback(err, null);
  
		imap.openBox('INBOX', false, function(err, result) {
			
			if(err) return callback(err, null);
			
			return callback(null, imap);
		});
	})
	
	function percentEncode(s) {
      if (s == null) {
          return "";
      }
      if (s instanceof Array) {
          var e = "";
          for (var i = 0; i < s.length; ++s) {
              if (e != "") e += '&';
              e += OAuth.percentEncode(s[i]);
          }
          return e;
      }
      s = encodeURIComponent(s);
      // Now replace the values which encodeURIComponent doesn't do
      // encodeURIComponent ignores: - _ . ! ~ * ' ( )
      // OAuth dictates the only ones you can ignore are: - _ . ~
      // Source: http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Functions:encodeURIComponent
      s = s.replace(/\!/g, "%21");
      s = s.replace(/\*/g, "%2A");
      s = s.replace(/\'/g, "%27");
      s = s.replace(/\(/g, "%28");
      s = s.replace(/\)/g, "%29");
      return s;
	}
}

GmailConnectionFactory.prototype.createConnectionByPassword = function(accountDetail, callback) {
	
	callback = callback || function (){};
	accountDetail = accountDetail || {};
	
	for(var key in this.setting){
		accountDetail[key] = this.setting[key];
	}
	
	var imap = new GmailConnection(accountDetail);
	imap.connect(function(err) {
		
		if(err) return callback(err, null);
		
		imap.openBox('INBOX', false, function(err, result) {
			
			if(err) return callback(err, null);
			return callback(null, imap);
		});
	});	
}