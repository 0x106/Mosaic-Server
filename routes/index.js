const express = require('express');
const puppeteer = require('puppeteer');
const fs = require("fs");
var router = express.Router();
const fonts = require('../fonts.json')

const googleFontAPIKey = "AIzaSyDP0GJ5DHi5yKGiJPL8NgEFrAY_LyVeHF8";

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

  // var nodeData = [];
  var nodeData = {};

  // generate a unique key for each node
  // - so that we can refer to a node's parent
  var nonTextCounter = 1
  for(var idx = 0; idx < dom.length; idx++) {

    // var key = dom[idx]['nodeName'] + "-" + generateKey(0)
    var key = ""
    if (dom[idx]['nodeName'] != '#text') {
        key = dom[idx]['nodeName'] + "-" + generateKey(nonTextCounter)
        nonTextCounter += 1;
    } else {
        key = dom[idx]['nodeName'] + "-" + generateKey(0)
    }

    dom[ idx ]['key'] = key;
    dom[ idx ]['parentKey'] = []
  }

  for(var idx = 0; idx < dom.length; idx++) {
    var children = dom[ idx ]["childNodeIndexes"]
    var childIndices = []
    if (children) {
      for(var kdx = 0; kdx < children.length; kdx++) {
        childIndices.push( dom[ children[kdx] ]["key"] )
        dom[ children[kdx] ]['parentKey'].push( dom[ idx ]['key'] );
      }
    }
    dom [ idx ]['childrenKeyIndices'] = childIndices
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

    if (!attr) {
      attr = ''
    }

    if (!pkey) {
      pkey = ''
    }

    if (nodeStyle) {
      nodeStyle = nodeStyle['properties']
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
    // nodeData.push(node);
    nodeData[key] = node;

  }

  fs.writeFile('snapshot.json', JSON.stringify(nodeData, null, 4), (err) => {
    if (err) {
        console.error(err);
        return;
    };
  });

  return nodeData
}

function generateKey(idx) {
  var text = idx.toString() + "-";
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  var keyLength = 8;

  for (var i = 0; i < keyLength; i++)
    text += chars.charAt(Math.floor(Math.random() * chars.length));

  return text;
}


var createStyleWhiteList = function() {

  let computedStyles = ['color', 'background-color', 'border-color', 'border-width', 'font-size',
                        'border-left-color', 'border-left-style', 'border-left-width',
                        'border-right-color', 'border-right-style', 'border-right-width',
                        'border-top-color', 'border-top-style', 'border-top-width',
                        'border-bottom-color', 'border-bottom-style', 'border-bottom-width',
                        'padding-left', 'padding-right', 'padding-top', 'padding-bottom',
                        'background-image',
                        'font-family', 'font-weight',
                        'display', 'text-align'
                      ];
  return computedStyles;
}

async function run(url) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.setViewport({
    width: 1600,
    height: 800
  });

  // await page.setViewport({
    // width: 1920,
    // height: 1080
  // });

  await page.goto(url)//, {"waitUntil" : "networkidle0"})

  await page._client.send('DOM.enable')
  await page._client.send('CSS.enable')
  await page._client.send('Animation.setPlaybackRate', { playbackRate: 12 });

  // const doc = await page._client.send('DOM.getDocument')

  let computedStyles = createStyleWhiteList();
  const snapshot = await page._client.send('DOMSnapshot.getSnapshot', {computedStyleWhitelist:computedStyles});
  let output = parse(snapshot)

  await browser.close()

  return output
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Atlas Reality' });
});

router.get('/client', function(req, res, next) {

  const url = req.query.atlasurl

  run(url).then((data) => {
    res.status(200).send(data)
  });
});

module.exports = router;
