var util = require('util');
var ImapConnectionFactory = require('../ImapConnectionFactory').ImapConnectionFactory;

var factory = new ImapConnectionFactory({
	host: 'imap.gmail.com',
  port: 993,
  secure: true,
});

factory.createConnection( { username: 'USERNAME', password: 'PASSWORD' }, function(err,conection) {
  
  conection.findMail('test', function(err, results) {
    
    if (err) die(err);
    
    console.log('Found : ' + results.length + ' messages');
    
    results.forEach(function() {

      conection.getMailHeader(results, function(err, mail_header) {
        console.log('Got a message with sequence number ' + mail_header.seqno);
        console.log('Finished message. Headers ' + util.inspect(mail_header,false,Infinity));
      });
    });
  });
});


