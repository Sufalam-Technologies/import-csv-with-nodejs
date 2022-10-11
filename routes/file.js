"use strict";
var express = require("express");
var router = express.Router();
const csv = require("csvtojson");
const path = require("path");
var fs = require("fs");
var multer = require("multer");
var mysql = require("mysql");
var notification = require("../notification");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

//path for store file
const upload = multer({
  dest: "./"
});

const con = mysql.createConnection({
  host: "localhost",
  database: "user_info",
  user: "root",
  password: ""
});

//saving file named ./product.csv
router.post("/upload", upload.any(), async (req, res) => {
  try {
    var attachment = req.files[0].originalname;
    var attach_split = attachment.split(".");
    var extension = attach_split[attach_split.length - 1];
    console.log("File Extension :", extension);

    var tempPath = req.files[0].path;

    var targetPath = path.join(__dirname, "../Products/" + "products.csv");

    if (extension == "csv" || extension == "xlsx") {
      fs.rename(tempPath, targetPath, (err) => {
        if (err) throw err;
        notification("file Uploaded");
        res.json({
          message: "File imported successfully."
        });
      });
    } else {
      fs.unlink(tempPath, (err) => {
        if (err) return handleError(err, res);
        res
          .status(403)
          .contentType("text/plain")
          .end("Only CSV | XLSX files are allowed to upload");
      });
    }
  } catch (err) {
    throw err;
  }
});

//insert record from products.csv
router.post("/insert", (req, res, next) => {
  var file = req.body.file;
  csv()
    .fromFile("./Products/" + file)
    .then(async (jsonObj) => {
      console.log("JSON Object :", jsonObj);
      for (const iterator of jsonObj) {
        let query = mysql.format(
          "INSERT INTO user_info " +
            "(logType,LogTime_Millis,zsaction,actionby,LogTime,ProjectID,zoid,SprintID,ItemID,AddedVia,LogOwnerDisaplayID,hookId,LogOwnerDisaplayName,LogDate) " +
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [
            iterator.logType,
            iterator.LogTime_Millis,
            iterator.zsaction,
            iterator.actionby,
            iterator.LogTime,
            iterator.ProjectID,
            iterator.zoid,
            iterator.SprintID,
            iterator.ItemID,
            iterator.AddedVia,
            iterator.LogOwnerDisaplayID,
            iterator.hookId,
            iterator.LogOwnerDisaplayName,
            new Date()
          ]
        );
        con.query(query, (err) => {
          if (err) throw err;
        });
      }
      res.end("Records Inserted successfully.");
    })
    .catch(next);
});

module.exports = router;
