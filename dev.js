const puppeteer = require('puppeteer');
const fs = require("fs");
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

  for(var idx = 0; idx < layout.length; idx++) {

    var nodeName  = dom[ layout[ idx ]['domNodeIndex'] ]['nodeName'];
    var nodeValue = dom[ layout[ idx ]['domNodeIndex']  ]['nodeValue'];
    var nodeLayout = layout[ idx ]['boundingBox'];
    var nodeStyle = styles[ layout[ idx ]['styleIndex'] ]

    if (nodeStyle) {
      nodeStyle = nodeStyle['properties']
    }


    var node = {
      "nodeName" : nodeName,
      "nodeValue" : nodeValue,
      "nodeLayout" : nodeLayout,
      "nodeStyle" : nodeStyle
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

  let computedStylesColor = ['color', 'background-color', 'border-color'];
  let computedStylesBorder = ['border-width'];
  let computedStyles = [];

  // ensure that any more style lists we create are added to computedStyles

  computedStyles = computedStyles.concat(computedStylesColor);
  computedStyles = computedStyles.concat(computedStylesBorder);

  if (argv.debug) {
    console.log(computedStyles);
  }

  return computedStyles;
}

async function run() {
  const browser = await puppeteer.launch()
  // const browser = await puppeteer.launch()
  const page = await browser.newPage()
  // await page.goto('localhost:3000/')
  await page.goto(argv['url'])
  // await page.goto('http://google.co.nz/')
  // await page.goto('https://murmuring-ocean-82758.herokuapp.com/')

  await page._client.send('DOM.enable')
  await page._client.send('CSS.enable')
  await page._client.send('Animation.setPlaybackRate', { playbackRate: 12 });

  // const doc = await page._client.send('DOM.getDocument')
  // const node = await page._client.send('DOM.querySelector', {nodeId: doc.root.nodeId, selector: 'h1'})
  // const fonts = await page._client.send('CSS.getPlatformFontsForNode', {nodeId: node.nodeId})

  let computedStyles = createStyleWhiteList();

  const snapshot = await page._client.send('DOMSnapshot.getSnapshot', {computedStyleWhitelist:computedStyles});

  parse(snapshot)

  await browser.close()
}


run();

//
// (async () => {
// })()
