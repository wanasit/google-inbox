var util = require('util');
var ImapConnectionFactory = require('../ImapConnectionFactory').ImapConnectionFactory;

var factory = new ImapConnectionFactory({
	host: 'imap.gmail.com',
  port: 993,
  secure: true,
});

factory.createConnection( { username: 'USERNAME', password: 'PASSWORD' }, function(err,conection) {
  
  conection.search([ 'UNSEEN', ['SINCE', 'May 20, 2012'] ], function(err, results) {
    if (err) die(err);
    var fetch = conection.fetch(results, {
      request: {
        headers: ['from', 'to', 'subject', 'date']
      }
    });
    fetch.on('message', function(msg) {
      console.log('Got a message with sequence number ' + msg.seqno);
      msg.on('end', function() {
        // msg.headers is now an object containing the requested headers ...
        console.log('Finished message. Headers ' + util.inspect(msg.headers,false,Infinity));
      });
    });
    fetch.on('end', function() {
      console.log('Done fetching all messages!');
      conection.logout();
    });
  });
});


