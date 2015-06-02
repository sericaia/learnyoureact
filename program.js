var Hapi = require('hapi');
var React = require('react'); 
var DOM = React.DOM; 
var body = DOM.body; 
var div = DOM.div; 
var script = DOM.script;

var browserify = require('browserify');

var fs = require('fs');

require('node-jsx').install(); 

var TodoBox = require('./views/index.jsx');

// Create a server with a host and port
var server = new Hapi.Server();
server.connection({ 
  host: 'localhost', 
  port: (process.argv[2] || 3000) 
});

var engine = require('hapijs-react-views')();

server.views({
  defaultExtension: 'jsx',
  engines: {
        jsx: engine, // support for .jsx files 
        js: engine // support for .js 
      }
    });

require('node-jsx').install();

// write below
var data = [];
data.push({title: "Shopping", detail: process.argv[3]});
data.push({title: "Hair cut", detail: process.argv[4]});

server.route({
  method: 'GET',
  path:'/bundle.js', 
  handler: function (request, reply) {

    var bundleData = browserify('./app.js') 
    .transform('reactify') 
    .bundle();    

    if (bundleData) {
      var name = 'bundle.js';
      var path = __dirname + "/" + name;
      var file = fs.createWriteStream(path);

      file.on('error', function (err) { 
        console.error(err) 
      });

      bundleData.pipe(file);

      bundleData.on('end', function (err) { 
        //TOCHANGE: use stream instead of file
        reply.file(path);
      })
    }
  }
});

server.route({
  method: 'GET',
  path:'/', 
  handler: function (request, reply) {

    var initialData = JSON.stringify(data); 
    var markup = React.renderToString(React.createElement(TodoBox, {data: data}));

    var html = React.renderToStaticMarkup(body(null, 
      div({id: 'app', dangerouslySetInnerHTML: {__html: markup}}), 
      script({id: 'initial-data', 
        type: 'text/plain', 
        'data-json': initialData 
      }), 
      script({src: '/bundle.js'}) 
      )); 

    reply(html).header('Content-Type', 'text/html'); 
  }
});

// Start the server
server.start();