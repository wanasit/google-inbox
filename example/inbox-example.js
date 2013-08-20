var util = require('util');
var express  = require('express');

var config = require('./config');
var gmail = require('../gmail');

/*
  ===========================================================================
            Setup express + passportjs server for authentication
  ===========================================================================
*/

var app = express();
var passport = require('passport')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

app.configure(function() {
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
});
app.listen(8082);

passport.use(new GoogleStrategy({
    clientID: config.consumer_key,
    clientSecret: config.consumer_secret,
    callbackURL: "http://localhost:8082/auth/callback",
    scope: ['openid', 'email', 'https://mail.google.com'] 
  },
  function(accessToken, refreshToken, profile, done) {
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;
    profile.email = profile.emails[0].value;
    return done(null, profile);
  }
));

app.get('/auth',
  passport.authenticate('google', { session: false }));

app.get('/auth/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  function(req, res) { 
     req.session.accessToken  = req.user.accessToken;
     req.session.email        = req.user.email;
     res.redirect('/');
  });


/*
  ===========================================================================
                                    GMail
  ===========================================================================
*/

app.all('/', function(req, res){
  
  if(!req.session.accessToken) return res.redirect('/auth');
  
  var accessToken  = req.session.accessToken;
  var email        = req.session.email;
  
  gmail({email:email, accessToken:accessToken, debug:true}, function(err, client){

      client.openMailbox("INBOX", function(error, info){
          if(error) throw error;
  
          client.listMessages(-10, function(err, messages){
              messages.forEach(function(message){
                  console.log(message.UID + ": " + message.title);
              });
              
              
          return res.send(messages);
      });
    });
  });
});


app.all('/:uid', function(req, res){
  
  if(!req.session.accessToken) return res.redirect('/auth');
  
  var accessToken  = req.session.accessToken;
  var email        = req.session.email;
  var uid          = req.params.uid;
  
  gmail({email:email, accessToken:accessToken, debug:true}, function(err, client){

    client.openMailbox("INBOX", function(error, info){
      if(error) throw error;
  
      var data = '';
      var stream = client.createMessageStream(uid);

      stream.on('data',function(chunk) { data += chunk });
      stream.on('end',function() { return res.send(data); });
    });
  });
});




4804

