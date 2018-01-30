const express = require('express');
const puppeteer = require('puppeteer');

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

  var nodeData = [];

  // generate a unique key for each node
  // - so that we can refer to a node's parent
  for(var idx = 0; idx < dom.length; idx++) {
    const key = generateKey()
    dom[ idx ]['key'] = key;

    var children = dom[ idx ]["childNodeIndexes"]

    if (children) {
      for(var kdx = 0; kdx < children.length; kdx++) {
        dom[ children[kdx] ]["parentKey"] = key;
      }
    }
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
          googleFonts[component] = fonts[component]["files"]['regular']
        } else {
          googleFonts[component] = fonts[component]["files"][font_weight]
        }
      }
    }

    style["properties"].push({"name":"googleFonts", "value":googleFonts})
  }

  for(var idx = 0; idx < layout.length; idx++) {

    var currentNode = layout[ idx ]['domNodeIndex'];

    var nodeName  = dom[ currentNode ]['nodeName'];
    var nodeValue = dom[ currentNode  ]['nodeValue'];
    var nodeLayout = layout[ idx ]['boundingBox'];
    var nodeStyle = styles[ layout[ idx ]['styleIndex'] ]

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
      'nodeStyle' : nodeStyle,
      'key' : key,
      'pkey' : pkey,
      'attr': attr
    };
    nodeData.push(node);

  }

  return nodeData
}

function generateKey() {
  var text = "";
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
                        'font-family', 'font-weight'
                      ];
  return computedStyles;
}

async function run(url) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.setViewport({
    width: 1000,
    height: 500
  });

  // await page.setViewport({
    // width: 1920,
    // height: 1080
  // });

  await page.goto(url)

  await page._client.send('DOM.enable')
  await page._client.send('CSS.enable')
  await page._client.send('Animation.setPlaybackRate', { playbackRate: 12 });

  const doc = await page._client.send('DOM.getDocument')

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
