var fs = require('fs');


console.log('retrieving config data');
fs.readFile('config.json', function(err, data){
  if (err) throw err;
  console.log(data);
  data = JSON.parse(data);
  console.log(data);
});
