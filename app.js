if (process.env.NODE_ENV !== "production") {
  require("dotenv").config()
}
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const bodyParser= require("body-parser");
const importExcel = require('convert-excel-to-json');
const methodOverride = require("method-override");
const mysql = require('mysql2');

const app = express();
app.use(methodOverride("_method"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(fileUpload({
    useTempFiles : true,
}));
app.use(express.static(__dirname + "/public"));

db = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database
});

db.connect(function(err) {
if (err) throw err;
console.log("Connected!");
});

app.get('/', (req, res) => {
    res.render("index");
});

app.post('/', (req, res) => {

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // Accessing the file by the <input> File name="target_file"
    let targetFile = req.files.target_file;
    //mv(path, CB function(err))
    targetFile.mv(path.join(__dirname, "uploads", targetFile.name), (err) => {
        if (err){
          return res.status(500).send(err);
        } else {
          let result = importExcel({
            sourceFile: path.join(__dirname, "uploads", targetFile.name),
            header: {rows: 1},
            columnToKey: {A: 'Name', B: 'Roll_no', C: 'Class'},
            sheets: ['Sheet1']
          });
          for (var i=2; result.Sheet1.length > i; i++){
            var sql = 'INSERT INTO students (Name, Roll_no, Class) VALUES (?, ?, ?)';
            db.query(sql,[result.Sheet1[i].Name, result.Sheet1[i].Roll_no, result.Sheet1[i].Class], function (err, result) {
              if (err) throw err;
              console.log("1 record inserted");
            });
          }
          res.redirect("/table");
          }
      });

});

app.get("/table", (req, res) => {
  var query2 = 'SELECT * FROM students';
  db.query(query2, function (err, data, fields) {
  if (err) throw err;
  res.render("table", {userData: data})
  console.log(data);
  });
})

app.post("/table", (req, res) => {
  var name = req.body.Name;
  var roll_no = req.body.Roll_no;
  var query3 = 'SELECT * FROM students WHERE Name = ? && Roll_no = ?';
  db.query(query3, [name, roll_no], function (err, data, fields) {
  if (err) throw err;
  res.render("table", {userData: data})
  console.log(data);
  });
})

// app.put("/table", (req, res) => {
//   var roll_no = req.body.Roll_no;
//   var query4 = 'SELECT * FROM students WHERE Roll_no = ?';
//   db.query(query4, [roll_no], function (err, data, fields) {
//   if (err) throw err;
//   res.render("table", {userData: data})
//   console.log(data);
//   });
// })


const port = process.env.PORT ||8888
app.listen(port, () => console.log('Your app listening on port 3000'));
