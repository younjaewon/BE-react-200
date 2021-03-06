var express = require("express");
var router = express.Router();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const awsAuth = require("../ignorefile/awsAuth");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

//mysql 서버 접속 정보
const pool = mysql.createPool({
  connectionLimit: 66,
  waitForConnections: true,
  host: awsAuth.host,
  port: "3306",
  database: awsAuth.database,
  user: awsAuth.user,
  password: awsAuth.password,
});

router.post("/", (req, res) => {
  const mybatisMapper = require("mybatis-mapper");
  var param = req.body;
  console.log(`body : ${param}`);
  
  //mybatis mapper경로 설정
  mybatisMapper.createMapper(["./models/" + param.mapper + ".xml"]);
  var time = new Date();
  console.log("## " + time + " ##");
  console.log("\n Called Mapper Name  = " + param.mapper);

  var format = { language: "sql", indent: "  " };
  //mysql 쿼리 정보 세팅
  var query = mybatisMapper.getStatement(
    param.mapper,
    param.mapper_id,
    param,
    format
  );
  console.log("\n========= Node Mybatis Query Log Start =========");
  console.log(
    "* mapper namespce : " + param.mapper + "." + param.mapper_id + " *\n"
  );
  console.log(query + "\n");
  try {
    pool.getConnection(function (err, connection) {
      connection.query(query, function (error, results) {
        if (error) {
          console.log("db error************* : " + error);
        }
        var time2 = new Date();
        console.log("## " + time2 + " ##");
        console.log("## RESULT DATA LIST ## : \n", results);
        if (results != undefined) {
          string = JSON.stringify(results);
          var json = JSON.parse(string);
          if (req.body.crud == "select") {
            if (param.mapper_id == "selectLoginCheck") {
              if (json[0] == undefined) {
                res.send(null);
                console.log("mapper id");
              } else {
                console.log("errorrr");
                bcrypt.compare(
                  req.body.is_Password,
                  json[0].userpassword,
                  function (err, login_flag) {
                    if (login_flag == true) {
                      res.send({ json });
                    } else {
                      res.send(null);
                    }
                  }
                );
              }
            } else {
              res.send({ json });
            }
          } else {
            res.send("succ");
          }
        } else {
          res.send("error");
        }

        connection.release();
        console.log("========= Node Mybatis Query Log End =========\n");
      });
    });
  } catch (error) {
    console.log("pool error : " + error);
  }
});

module.exports = router;