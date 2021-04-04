// 设置express框架
const express = require("express");
const app = new express();
const port = 3000;

// 引入第三方组件
const request = require("request");
const mysql = require("mysql");

// ------ 逻辑代码 ------
// 创建一个数据库连接池
let pool = mysql.createPool({
  host: "192.168.30.130",
  port: "3306",
  database: "testdb",
  user: "apitest",
  password: "111111",
  connectionLimit: 100, //连接池大小
});

//定义创建数据库链接函数
const addContent = function (sql, sqlParams, req, res, callback) {
  //使用
  pool.getConnection((err, connection) => {
    if (err) {
      console.log("连接失败：" + err);
      res.json({
        code: 50000,
        msg: "服务器内部错误！请联系管理员。",
      });
    } else {
      connection.query(sql, sqlParams, function (err, result) {
        if (err) {
          console.log("[ERROR] - ", err.message);
          res.json({
            code: 50000,
            msg: "服务器内部错误！请联系管理员。",
          });
          return;
        }
        callback(result);
      });
      //释放
      connection.release();
    }
  });
};

// ------ 接口 ------
app.get("/", (req, res) => {
  url = "https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN";
  request(
    {
      url: url,
      method: "GET",
    },
    (error, response, body) => {
      if (!error && response.statusCode == 200) {
        console.log(body); // 请求成功的处理逻辑
        res.send(body)
      }
    }
  );
  // let sql = `SELECT * FROM account WHERE username='1'`;
  // addContent(sql, null, req, res, (result) => {
  //   // result = JSON.parse(result);
  //   res.send(result);
  // });
});

// // 工作用，临时代理
// app.get("/aaa", (req, res) => {
//   console.log(req.query)
//   url = "/qlang/designer/getAppDesc";
//   request(
//     {
//       url: 'http://10.0.16.204:8087/' + url + ,
//       method: "GET",
//     },
//     (error, response, body) => {
//       if (!error && response.statusCode == 200) {
//         console.log(body); // 请求成功的处理逻辑
//         res.send(body)
//       }
//     }
//   );
//   // let sql = `SELECT * FROM account WHERE username='1'`;
//   // addContent(sql, null, req, res, (result) => {
//   //   // result = JSON.parse(result);
//   //   res.send(result);
//   // });
// });

// 开始监听
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
