var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

const puppeteer = require('puppeteer');
const fonts = require('./fonts.json')

function isGoogleFont(fontname) {
  var response = fonts[fontname]
  if (response === undefined) {
    return false
  }
  return true
}

let parse = function(snapshot) {

  const dom = snapshot['domNodes'];
  const layout = snapshot['layoutTreeNodes'];
  const styles = snapshot['computedStyles'];

  var nodeData = {};

  // generate the key
  var nonTextCounter = 1
  for(var idx = 0; idx < dom.length; idx++) {
    var key = ""
    var test = 0
    if (dom[idx]['nodeName'] != '#text') {
        key = dom[idx]['nodeName'] + "-" + generateKey(nonTextCounter)
        nonTextCounter += 1;
        test = 1
    } else {
      key = dom[idx]['nodeName'] + "-" + generateKey(0)
      test = 2
    }

    dom[ idx ]['key'] = key;
    dom[ idx ]['parentKey'] = []
  }

  for(var idx = 0; idx < dom.length; idx++) {

    var children = dom[ idx ]["childNodeIndexes"]
    var childIndexes = []
    if (children) {
      for(var kdx = 0; kdx < children.length; kdx++) {
        childIndexes.push(dom[ children[kdx] ]["key"])
        dom[ children[kdx] ]['parentKey'].push( dom[ idx ]['key'] );
      }
    }
    dom [ idx ]['childrenKeyIndices'] = childIndexes

  }

  for (var idx = 0; idx < styles.length; idx++) {

    var font_family = styles[idx]["properties"][22]["value"]
    var font_weight = (styles[idx]["properties"][23]["value"]).toString()
    var components = font_family.split(',')
    var googleFonts = {};

    for (var i = 0; i < components.length; i++) {
      var component = components[i].trim().replace(/\"/g, '').replace(/\'/g, '');
      if(isGoogleFont(component)) {

        var weight_file = fonts[component]["files"][font_weight]
        if (weight_file === undefined) {
          googleFonts[component] = {'url':fonts[component]["files"]['regular'], 'weight': 'regular'}
        } else {
          googleFonts[component] = {'url':fonts[component]["files"][font_weight], 'weight': font_weight}
        }
      }
    }

    styles[idx]["properties"].push({"name":"googleFonts", "value":googleFonts})
  }

  var nodeKeys = [];
  for(var idx = 0; idx < layout.length; idx++) {

    var currentNode = layout[ idx ]['domNodeIndex'];

    var nodeName  = dom[ currentNode ]['nodeName'];
    var nodeValue = dom[ currentNode  ]['nodeValue'];
    var nodeLayout = layout[ idx ]['boundingBox'];
    var nodeStyle = styles[ layout[ idx ]['styleIndex'] ]

    var nodeChildren = dom[ currentNode ]['childrenKeyIndices']
    if (!nodeChildren) {
      nodeChildren = ''
    }

    var key = dom[ currentNode ]['key'];
    var pkey = dom[ currentNode ]['parentKey'];

    var attr = dom[ currentNode ]['attributes']

    if (!attr) {attr = [{'name':'atlas', 'value':'reality'}]}

    if (!pkey) { pkey = '' }

    if (nodeStyle) {
      nodeStyle = nodeStyle['properties']
    } else {
	     nodeStyle = [{'name':'atlas','value':'reality'}]
    }

    var node = {
        'nodeName' : nodeName,
        'nodeValue' : nodeValue,
        'nodeLayout' : nodeLayout,
        'nodeChildren' : nodeChildren,
        'nodeStyle' : nodeStyle,
        'key' : key,
        'pkey' : pkey,
        'attr': attr
    };
    nodeData[key] = node;
    nodeKeys.push(key);

  }

  return [nodeData, nodeKeys]
}

function sendData(snapshot, socket) {
  socket.emit('renderTreeStart')
  var parsed = parse(snapshot)
  var data = parsed[0]
  var keys = parsed[1]

  var renderTree = [];
  var ptr = 0;
  data[keys[ptr]]['depth'] = 0
  socket.emit('node', data[ keys[ptr] ]  )

  var shadowTree = {}

  renderTree.push( keys[ptr] )

  console.log("Sending render tree...");

  while(ptr < renderTree.length) {
      var parentKey = renderTree[ ptr ]
      shadowTree[parentKey] = {}

      var children = data[ parentKey ]['nodeChildren']
      if (children) {

          for (var i = 0; i < children.length; i++) {

              if ( data[children[i]] ) {

                  data[children[i]]['depth'] = data[ parentKey ]['depth'] + 1
                  socket.emit('node', data[children[i]]  )

                  renderTree.push(children[i]);
                  shadowTree[ parentKey ][children[i]] = {}
              }
          }
      }
      ptr += 1
  }

  var shadowTreeData = {}
  shadowTreeData["shadowTree"] = shadowTree
  shadowTreeData["root"] = renderTree[0]

  console.log("Render tree sent...");

  socket.emit('renderTreeComplete', shadowTreeData)
}

io.on('connection', function(socket) {

   console.log('connection on server established ...');

   socket.emit('response', "Connection successful")

   socket.on('url', function(url) {

      getData(url).then( function(snapshot) {

        if (snapshot["atlas"]["filename"] != "") {
          var configFileName = snapshot["atlas"]["filename"] + ".json"
          fs.readFile(configFileName, function(read_err, data){

            try {
      	      data = JSON.parse(data);
      	      console.log("Read config file...");
            } catch(parse_error) {
              sendData(snapshot, socket)
            }
            socket.emit('config', data, function(response) {
              sendData(snapshot, socket)
            });
          });
        } else {
          sendData(snapshot, socket)
        }

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

function getAtlas(snapshot) {
  atlas = {}
  for (var i = 0; i < snapshot["domNodes"].length; i++) {
    if (snapshot["domNodes"][i]["nodeName"] == "ATLAS") {
      atlas['data'] = snapshot["domNodes"][i]
      var attr = atlas["data"]["attributes"]
      if (attr) {
        for (var i = 0; i < attr.length; i++) {
          if(attr[i]["name"] == 'id') {
            atlas["filename"] = attr[i]["value"]
            return atlas
          }
        }
      }
    }
  }
  return atlas
}

async function getData(url) {

  console.log("Initialising page retrieval");

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto(url)
  await page.setViewport({
  	width: 1400,
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
                        'display', 'visibility'
                      ];


  console.log("Retrieving webpage...");

  const snapshot = await page._client.send('DOMSnapshot.getSnapshot', {computedStyleWhitelist:computedStyles});
  snapshot["atlas"] = getAtlas(snapshot)

  console.log("Retrieved data...");

  await browser.close()
  return snapshot
}

http.listen(3000, function(){
   console.log('listening on *:3000');
});
