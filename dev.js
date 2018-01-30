const puppeteer = require('puppeteer');
const fs = require("fs");
const http = require("http");
const argv = require('minimist')(process.argv.slice(2));

if (argv.debug) {
  console.log(argv);
}

let parse = function(snapshot) {

  const dom = snapshot['domNodes'];
  const layout = snapshot['layoutTreeNodes'];
  const styles = snapshot['computedStyles'];

  var nodeData = [];

  if (argv.debug) {
    console.log(snapshot)
  }

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

  fs.writeFile(argv['outfile'], JSON.stringify(nodeData, null, 4), (err) => {
    if (err) {
        console.error(err);
        return;
    };
  });
}

var createStyleWhiteList = function() {

  let computedStyles = ['color', 'background-color', 'border-color', 'border-width', 'font-size'];

  if (argv.debug) {
    console.log(computedStyles);
  }

  return computedStyles;
}

function interrogate(node) {

  console.log(node);
  console.log("=======================================");

  if (node.children) {
    for (var idx = 0; idx < node.childNodeCount; idx++) {
      interrogate(node.children[idx])
    }
  }
}

function generateKey() {
  var text = "";
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  var keyLength = 8;

  for (var i = 0; i < keyLength; i++)
    text += chars.charAt(Math.floor(Math.random() * chars.length));

  return text;
}

async function run() {
  const browser = await puppeteer.launch({headless:false})
  // const browser = await puppeteer.launch()
  const page = await browser.newPage()
  // await page.goto('localhost:3000/')
  await page.goto(argv.url)
  await page.setViewport({
  	width: 1920,
  	height: 1080
  });

  var viewport = await page.viewport()
  console.log(viewport);
  // await page.goto('http://google.co.nz/')
  // await page.goto('https://murmuring-ocean-82758.herokuapp.com/')

  // let bodyHTML = await page.evaluate(() => document.body.outerHTML);
  const html = await page.evaluate('new XMLSerializer().serializeToString(document.doctype) + document.documentElement.outerHTML');

  // console.log( html);

  await page._client.send('DOM.enable')
  await page._client.send('CSS.enable')
  await page._client.send('Animation.setPlaybackRate', { playbackRate: 12 });

  const doc = await page._client.send('DOM.getDocument')

  // interrogate(doc.root)
  const node = await page._client.send('DOM.querySelector', {nodeId: doc.root.nodeId, selector: 'h1'})
  const fonts = await page._client.send('CSS.getPlatformFontsForNode', {nodeId: node.nodeId})

  // const allNodes = await page._client.send('DOM.querySelectorAll', {
  //       nodeId: doc.root.nodeId,
  //       selector: '*'
  //   });
  //
  // console.log(allNodes);
  //
  // const stylesForNodes = []
  // for (id of allNodes.nodeIds) {
  //   stylesForNodes.push(await page._client.send('CSS.getMatchedStylesForNode', {nodeId: id}));
  // }

  const hrefs = await page.evaluate(() => {
    const anchors = document.querySelectorAll('a');
    return [].map.call(anchors, a => a.href);
  });

  // console.log(hrefs);

  let computedStyles = createStyleWhiteList();
  const snapshot = await page._client.send('DOMSnapshot.getSnapshot', {computedStyleWhitelist:computedStyles});
  // console.log(snapshot);
  parse(snapshot)

  // await browser.close()
}


run();


// console.log(http);




















// end
