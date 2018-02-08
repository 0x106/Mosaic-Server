var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const puppeteer = require('puppeteer');



app.get('/', function(req, res){
   res.sendFile(__dirname + '/index.html');
});

function run() {
  for (var i = 0; i < 10; i++) {
    io.emit('message', i)
  }
}

io.on('connection', function(socket) {

   console.log('connection on server established ...');

   io.emit('response', "Connection successful")

   socket.on('msg', function(msg) {
      console.log(`msg recvd: ${msg}`);
   });

   socket.on('url', function(url) {
      console.log(`url recvd: ${url}`);
      getData(url).then( function(snapshot) {

        var renderTree = computeRenderTree(snapshot)

        // var indices = renderTree[0]

        // for (var i = 0; i < indices.length; i++) {
          // io.emit('renderTree', renderTree[ indices[i] ])
        // }

        io.emit('renderTree', renderTree)

      });
   });
});

function generateKey() {
  var text = "";
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  var keyLength = 8;

  for (var i = 0; i < keyLength; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return text;
}

function computeRenderTree(snapshot) {

  const dom = snapshot['domNodes'];
  const layout = snapshot['layoutTreeNodes'];
  const style = snapshot['computedStyles'];

  var layoutNodes = {};
  var layoutIndices = [];
  for (var i = 0; i < layout.length; i++) {
    layoutNodes[ layout[i]['domNodeIndex'] ] = layout[i]
    layoutIndices.push(layout[i]['domNodeIndex']);
  }

  var nodeData = {};
  var renderTree = [];
  var ptr = 0;

  // add the first layout node to the list

  var key = generateKey();
  var node = {
    'key': key,
    'node': dom[ layoutNodes[layoutIndices[ptr]]['domNodeIndex'] ],
    'layout':  layoutNodes[layoutIndices[ptr]],
    'style': style[ layoutNodes[layoutIndices[ptr]]['styleIndex'] ]
  };
  nodeData[key] = node;

  renderTree.push( layoutNodes[ layoutIndices[ptr] ] )

  // while there is still a node left to examine
  while(ptr < renderTree.length) {

    // get the layout node that we want to examine
    var next = layoutNodes[ layoutIndices[ptr] ]

    // get all the children from this node in the dom
    var children = dom[ next['domNodeIndex'] ]['childNodeIndexes']

    // if there are any children values
    if (children) {

      // for each of the children values
      for (var i = 0; i < children.length; i++) {

        // get the layout node that corresponds to this
        //  child node / dom node index
        var layoutChild = layoutNodes[ children[ i ] ]

        // if it is a valid layout node then add it to the tree
        if (layoutChild) {
          renderTree.push( layoutChild );
          var key = generateKey();

          console.log(key);

          // if (style[ layoutChild ]) {
            var childStyle = style[ layoutChild['styleIndex'] ]

            if (childStyle) {
              var node = {
                'key': key,
                'node': dom[ layoutChild['domNodeIndex'] ],
                'layout':  layoutChild,
                'style': childStyle
              };
              nodeData[key] = node;
            }
          }
        // }

      }
    }
    ptr += 1
  }

  // for (var i = 0; i < renderTree.length; i++) {
  //   console.log(renderTree[i]['domNodeIndex'])
  // }

  return nodeData
}

async function getData(url) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto(url)

  await page.setViewport({
  	width: 1920,
  	height: 1080
  });

  await page._client.send('DOM.enable')
  await page._client.send('CSS.enable')
  await page._client.send('Animation.setPlaybackRate', { playbackRate: 12 });

  const computedStyles = ['color', 'background-color', 'border-color', 'border-width', 'font-size',
                        'border-left-color', 'border-left-style', 'border-left-width',
                        'border-right-color', 'border-right-style', 'border-right-width',
                        'border-top-color', 'border-top-style', 'border-top-width',
                        'border-bottom-color', 'border-bottom-style', 'border-bottom-width',
                        'padding-left', 'padding-right', 'padding-top', 'padding-bottom',
                        'background-image',
                        'font-family', 'font-weight',
                        'display'
                      ];

  const snapshot = await page._client.send('DOMSnapshot.getSnapshot', {computedStyleWhitelist:computedStyles});
  await browser.close()

  return snapshot
}

http.listen(3000, function(){
   console.log('listening on *:3000');
});
