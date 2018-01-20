const express = require('express');
// const puppeteer = require('puppeteer');

var router = express.Router();

// let scrape = async () => {
//   var data = {
//     "name": "Jordan",
//     "url": "atlasreality.xyz",
//   };
//
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto('http://books.toscrape.com/');
//   await page.waitFor(1000);
//   // Scrape
//
//   browser.close();
//   return data
// };

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Atlas Reality' });
});

// router.get('/scraper', function(req, res, next) {
//   scrape().then((data) => {
//     res.render('scraper', { data: data });
//   });
// });

module.exports = router;
