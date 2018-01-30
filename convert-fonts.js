const google_fonts = require('./google-fonts.json')
const fs = require('fs  ')

var fonts = {};
var length = google_fonts.length

for (var idx = 0; idx < length; idx++) {
  var key = google_fonts[idx]["family"]
  var value = google_fonts[idx]
  fonts[key] = value
}

fs.writeFile("fonts.json", JSON.stringify(fonts, null, 4), (err) => {
  if (err) {
      console.error(err);
      return;
  };
});
