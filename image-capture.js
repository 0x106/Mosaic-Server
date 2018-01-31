const fs = require('fs');
const puppeteer = require('puppeteer');

async function run() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 926 });

    let counter = 0;
    page.on('requestfinished', (request) => {
  	    const matches = /.*\.(jpg|png|svg|gif)$/.exec(request.url);
  	    if (matches && (matches.length === 2)) {
      		const extension = matches[1];
      		const res = request.response();
      		const buffer = res.buffer();
      		fs.writeFileSync(`images/image-${counter}.${extension}`, buffer, 'base64');
      		counter += 1;
  	    }
  	});

    await page.goto('https://intoli.com/blog/saving-images/');
    await page.waitFor(10000);

    await browser.close();
};

run()
