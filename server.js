'use strict';

var express = require('express')
var session = require('express-session')
var bodyParser = require('body-parser')
var http = require("https")
var Grant = require('grant-express'), 
grant = new Grant(require('./config/config.json'))
var jsonfile = require('jsonfile')
var file = './tmp/data.json'

var app = express()

// REQUIRED:
app.use(session({secret:'very secret'}))
// mount grant
app.use(grant)

app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// set the view engine to ejs
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('pages/index');
});

app.get('/handle_callback', function (req, res) {
  if(req.query.raw.ok == 'false'){

    // Send error message
    //console.log(req.query)
    res.end(req.query.raw.error)
    
  }
  else{
    var team_name = req.query.raw.team_name;
    var token = req.query.access_token;
    
    var options = {
      'method': 'GET',
      'hostname': 'slack.com',
      'path': '/api/channels.list?token='+token,
      'headers': {}
    };


    http.get(options, function(res) {
      console.log("Got response: " + res.statusCode);

        res.on("data", function(res) {
          console.log("BODY: " + res);
          var data = JSON.parse(res);
          var channels = data.channels;
          console.log(channels);
          jsonfile.writeFile(file, channels, function (err) {
            console.error(err)
          })
        });

        res.on("end", function(res) {
          //console.log("BODY: " + res);
        });


    }).on('error', function(e) {
      console.log("Got error: " + e.message);
    });

    var channels = jsonfile.readFileSync(file);
      console.log(channels);
    // Render
    res.render('pages/dashboard', {
              team_name: team_name,
              channels: channels,
              token: token
    });
  }
})



app.get('/channels/:channelId/post', function (req, res) {
  var token = req.query.token;
  var channelId = req.params.channelId;
  //console.log(token);
  //console.log(channelId);
  var msg = '';
    res.render('pages/post', {token: token, msg:msg});
});

app.post('/channels/:channelId/post', function (req, res) {
  var token = req.query.token;
  var channelId = req.params.channelId;
  var message = req.body.message;
  //console.log(message);

  var options = {
    'method': 'GET',
    'hostname': 'slack.com',
    'port': null,
    'path': '/api/chat.postMessage?token='+token+'&channel='+channelId+'&text='+message+'&as_user=true',
    'headers': {}
  };

  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      //console.log(body.toString());
    });
  });

  req.end();
  var msg = 'The message has been send';
  res.render('pages/post', {msg:msg});
});


app.listen(3000, function () {
  console.log('Express server listening on port ' + 3000)
})