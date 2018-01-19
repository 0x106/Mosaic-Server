const puppeteer = require('puppeteer');

// let scrape = async () => {
//
//   const browser = await puppeteer.launch({headless : false,
//                         args :[
//                                 '--run-layout-test'
//                         ]});
//   const page = await browser.newPage();
//   await page.goto('http://localhost:3000/');
//   await page.waitFor(1000);
//
//   let dom = await page.evaluate(() => {
//     // var el = document.getElementsByTagName('p');
//     return Array.from(document.getElementsByTagName('h1')).map(h1 => h1);
//     // return el
//   });
//
//   browser.close();
//   return dom
// };
//
// console.log("Bolt");
// console.log("====");
//
// scrape().then( function(data) {
//     console.log("DOM:", data);
//   }
// );

let parse = function(snapshot) {

  const dom = snapshot['domNodes']
  const layout = snapshot['layoutTreeNodes']
  const styles = snapshot['computedStyles']

  // console.log(dom[11]);
  //
  // for(var idx = 0; idx < dom[11].childNodeIndexes.length; idx++) {
  //   console.log("DOM:", dom[dom[11].childNodeIndexes[idx]]['nodeName'], dom[dom[11].childNodeIndexes[idx]]['nodeValue']);
  //   var li = dom[dom[11].childNodeIndexes[idx]]['layoutNodeIndex']
  //   if (li) {
  //     console.log("LAYOUT:", layout[li]);
  //     var si = layout[li]['styleIndex']
  //     if (si) {
  //       console.log("STYLE", styles[si]);
  //     }
  //   }
  //   console.log("------------------------");
  // }

  // for(var idx = 0; idx < dom.length; idx++) {
  //   console.log(idx, dom[idx].childNodeIndexes);
  // }
  //
  // for(var idx = 0; idx < styles.length; idx++) {
  //   console.log(idx, styles[idx]);
  // }

  for(var idx = 0; idx < layout.length; idx++) {

    var nodeName = dom[ layout[ idx ]['domNodeIndex']]['nodeName']
    var nodeValue = dom[ layout[ idx ]['domNodeIndex']]['nodeValue']
    var nodeLayout = layout[ idx ]['boundingBox']

    var nodeJSON = {
      "nodeName" : nodeName,
      "nodeValue" : nodeValue,
      "nodeLayout" : nodeLayout,
    }

    console.log(nodeJSON);

    // if (value != '') {
      // console.log( "DOM:", nodeName, "||", nodeValue );
      // // console.log("DOM", dom[ layout[ idx ]['domNodeIndex']]);
      // console.log("LAYOUT:", layout[ idx ]['boundingBox']);
      // console.log( "STYLE:", styles[ layout[ idx ]['styleIndex']] );
      // console.log("------------------------");
    // }

  }

}


let computedStyles = ['color', 'background-color'];

(async () => {
  const browser = await puppeteer.launch({headless:false})
  // const browser = await puppeteer.launch()
  const page = await browser.newPage()
  // await page.goto('localhost:3000/')
  await page.goto('http://google.co.nz/')
  // await page.goto('https://murmuring-ocean-82758.herokuapp.com/')

  await page._client.send('DOM.enable')
  await page._client.send('CSS.enable')

  // const doc = await page._client.send('DOM.getDocument')
  // const node = await page._client.send('DOM.querySelector', {nodeId: doc.root.nodeId, selector: 'h1'})
  // const fonts = await page._client.send('CSS.getPlatformFontsForNode', {nodeId: node.nodeId})

  const snapshot = await page._client.send('DOMSnapshot.getSnapshot', {computedStyleWhitelist:computedStyles});

  parse(snapshot)

  await browser.close()
})()
