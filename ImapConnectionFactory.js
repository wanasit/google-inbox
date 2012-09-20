


var util = require('util');
var ImapConnection = require('imap').ImapConnection;
var MailParser = require("mailparser").MailParser;


//======== ImapConnection extended methods

ImapConnection.prototype.findMail = function(searchTerm, callback) {
	
	var query = searchTerm ? [['TEXT',searchTerm]] : ['ALL'];
	this.search(query, callback);
}

ImapConnection.prototype.getMail = function(mailId, callback) {

	var mailHeader = null;
	var mailBody = null;
	
	var fetchHeader = this.fetch(mailId, { request: {body: false, headers:true, struct:true} });
	fetchHeader.on('message', function(msg) {
    msg.on('end', function() {
			mailHeader = msg.headers;
			finishFetch();
    });
  });
	
	
	var fetchBody = this.fetch(mailId, { request: {body: true, headers:false, struct:true} });
	fetchBody.on('message', function(msg) {
		
		var parser = new MailParser();
		
		msg.on('data', function(shunk) {
			parser.write(shunk);
    });

    msg.on('end', function() {
			parser.end()
    });

		parser.on('end',function(mail) {
			mailBody = mail;
			finishFetch()
		})
  });

	function finishFetch(){
		
		if(mailBody && mailHeader){
			
			mailBody.headers = mailBody.headers || {};
			for(var key in mailHeader){
				
				mailBody.headers[key] = mailHeader[key]; 
			}
			 
			callback(null,mailBody)
		}
	}
}

ImapConnection.prototype.getMailHeader = function(mailId, callback) {

	var mailHeader = null;
	var mailBody = null;
	
	var fetchHeader = this.fetch(mailId, { request: {body: false, headers:true, struct:true} });
	fetchHeader.on('message', function(msg) {
    msg.on('end', function() {
			return callback(null, msg.headers)
    });
  });
}


//======== ImapConnectionFactory

function ImapConnectionFactory(setting) {
	this.setting = setting || {};
}

ImapConnectionFactory.prototype.createConnection = function(accountDetail, callback) {
	
	callback = callback || function (){};
	accountDetail = accountDetail || {};
	
	for(var key in this.setting){
		accountDetail[key] = this.setting[key];
	}
	
	var imap = new ImapConnection(accountDetail);
	imap.connect(function(err) {
		
		if(err) return callback(err, null);
		
		imap.openBox('INBOX', false, function(err, result) {
			
			if(err) return callback(err, null);
			return callback(null, imap);
		});
	})
}

ImapConnectionFactory.prototype.findMail = function(accountDetail, searchTerm, callback) {
	
	this.createConnection(accountDetail, function(err, connection) {
		
		connection.findMail(searchTerm, callback)
	})
}

ImapConnectionFactory.prototype.getMail = function(accountDetail, mailId, callback) {
	
	this.createConnection(accountDetail, function(err, connection) {
		
		connection.getMail(mailId, callback)
	})
}

ImapConnectionFactory.prototype.getMailHeader = function(accountDetail, mailId, callback) {
	
	this.createConnection(accountDetail, function(err, connection) {
		
		connection.getMail(mailId, callback)
	})
}


//======== Exports
exports.ImapConnectionFactory = ImapConnectionFactory;
exports.ImapConnection 	 			= ImapConnection;
