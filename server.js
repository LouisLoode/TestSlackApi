'use strict';

/*
* CONFIGURATION
*/

// Init packages
var express = require('express')
var session = require('express-session')
var bodyParser = require('body-parser')
var http = require("https")
var Grant = require('grant-express'), 
grant = new Grant(require('./config/config.json'))
var jsonfile = require('jsonfile')
var file = './tmp/data.json' // Cache file for

// Ini app
var app = express()

// set the view engine to ejs
app.set('view engine', 'ejs');

/*
* MIDDLEWARES
*/

// 
app.use(session({secret:'very secret'}))
// mount grant
app.use(grant)

app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


/*
* ROUTES
*/

// Index
app.get('/', function (req, res) {
  // Render ejs
  res.render('pages/index');
});

// Callback with list of channels
app.get('/handle_callback', function (req, res) {

  // Init cache file for channel listings
  /*var content = '';
  jsonfile.writeFile(file, content, function (err) {
            console.error(err)
  })*/

  // Check if the request work
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

    // http request
    var req = http.request(options, function (res) {
    var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
        var data = JSON.parse(body);
        var channels = data.channels;

          //console.log(channels);
          // write result in cache file
          jsonfile.writeFile(file, channels, function (err) {
            console.error(err)
          })

        console.log(body.toString());
      });
    });

    req.end();
  

    // read cache file with channels list
    var channels = jsonfile.readFileSync(file);
      //console.log(channels);
  
    // Render ejs
    res.render('pages/dashboard', {
              team_name: team_name,
              channels: channels,
              token: token
    });
  }
})


// GET page post
app.get('/channels/:channelId/post', function (req, res) {
  var token = req.query.token;
  var channelId = req.params.channelId;
  //console.log(token);
  //console.log(channelId);
  var msg = '';
  res.render('pages/post', {token: token, msg:msg});
});

// POST message on specific channel
app.post('/channels/:channelId/post', function (req, res) {
  var token = req.query.token;
  var channelId = req.params.channelId;
  var message = encodeURIComponent(req.body.message);
  //console.log(message);

  var options = {
    'method': 'GET',
    'hostname': 'slack.com',
    'port': null,
    'path': '/api/chat.postMessage?token='+token+'&channel='+channelId+'&text='+message+'&as_user=true',
    'headers': {}
  };

  // http request
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
  // Message
  var msg = 'The message has been send';
  // Render ejs
  res.render('pages/post', {msg:msg});
});

// Listening App on port 3000
app.listen(3000, function () {
  console.log('Express server listening on port ' + 3000)
})