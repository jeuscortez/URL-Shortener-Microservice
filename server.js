// init project
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var mongoose = require('mongoose');
const shortUrl = require("./models/shortUrl");
var app = express();

app.use(cors());
app.use(bodyParser.json());
// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

//set up connection to mongooseDB
mongoose.connect(process.env.MONGODB_URI);

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/:urlToShorten(*)',function(req,res){
  
  var urlToShorten = req.params.urlToShorten;
  
  //Regex for URL
  var regex =/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
  
  if(regex.test(urlToShorten)===true && urlToShorten !== "favicon.ico" && urlToShorten !== "client.js"){
      
  //make query to check if website exists in db already
  shortUrl.findOne({originalUrl: urlToShorten}).exec(function(err,data){
      if(err){
          return res.send("error");
      }
      if(data!==null){
        //console.log(data.originalUrl);
        var data = new shortUrl({
            originalUrl : data.originalUrl,
            shorterUrl: data.shorterUrl
            });
        return res.json(data);
    }else{ //Insert website and generate shorterUrl into mLab DB
      InsertToDB(urlToShorten,res);
    }
  });
  }else //search for shorterUrl in mLab DB
      queryDB(urlToShorten,res);  
});


function InsertToDB(urlToSave,res){
  //console.log("Saving to database");
    var short = Math.floor(Math.random()*100000).toString();
    
    var data = new shortUrl({
      originalUrl : urlToSave,
      shorterUrl: short
    });
    
    data.save(function(err){
      if(err){
        return res.send('Error saving to database');
      }
      
    });
    //console.log(data);
     return res.json(data);
}

//make query to database collection to redirect to url short website 
function queryDB(shorterURL,res){
    
  if(shorterURL === null){
       return res.send("error, its null");
    }
       
    shortUrl.findOne({shorterUrl: shorterURL}).exec(function(err,data){
    
    //console.log(data);
    if(err){
      return res.send("Error reading database");
    }
    if(data!==null){
    var re = new RegExp("^(http|https)://","i");
    var strToCheck = data.originalUrl;
    
    //console.log(strToCheck);
    if(re.test(strToCheck)){
      //console.log(data.originalUrl);
       res.redirect(301, data.originalUrl);
       }
    else{
      //console.log('http://' + data.originalUrl);
      res.redirect(301,'http://' + data.originalUrl);
    }
    }else{  
  var data = new shortUrl(
    {  
      originalUrl : "Url does not match standard format",
      shorterUrl: "Invalid Url"
    }
  );
  return res.json(data);
    }
  });
}

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

/*function connect() {
  return new Promise(function (resolve, reject) {
    try {
      mongodb.MongoClient.connect(MONGODB_URI, function(err, db) {
        if(err) reject(err);
        collection = db.collection(process.env.COLLECTION);
        resolve(collection);
      });
    } catch(ex) {
      reject(new DatastoreUnknownException("connect", null, ex));
    }
  });
}*/