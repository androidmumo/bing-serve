// 导入配置文件
const { base, database } = require("./config/config");

// 导入模块
const {
  processImageGrey,
  processImageGauss,
  processImageResize,
} = require("./model/processImage");
const { logger } = require("./model/log4js");

// 设置express框架
const express = require("express");
const app = new express();
const { port, dir } = base;

// 原生模块
const fs = require("fs");

// 第三方模块
const axios = require("axios");
const mysql = require("mysql");
const dayjs = require("dayjs");

// ------ 逻辑代码 start------
// 定义变量
let bingJson = {};
let saveDir = "";

// 创建一个数据库连接池
let pool = mysql.createPool(database);

//定义创建数据库链接函数
const addContent = function (sql, sqlParams, req, res, callback) {
  //使用
  pool.getConnection((err, connection) => {
    if (err) {
      logger.error("数据库连接失败 " + err);
      res.json({
        code: 50000,
        msg: "服务器内部错误！请联系管理员。",
      });
    } else {
      connection.query(sql, sqlParams, function (err, result) {
        if (err) {
          logger.error("数据库错误 " + err.message);
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

// 请求接口 获取bing官方JSON数据
const getBingJson = async function () {
  await axios({
    method: "get",
    url:
      "https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN",
  }).then((response) => {
    bingJson = response.data;
    logger.info("获取bingJson成功");
  }).catch(err => {
    logger.error("获取bingJson失败 " + err);
  });
};

// 创建目录
const createDirectory = async function (dir, recursive) {
  await fs.mkdir(dir, { recursive }, function (error) {
    if (error) {
      logger.error("创建目录失败 " + error);
      return false;
    }
    logger.info("创建目录成功: " + dir);
  });
};

// 下载图片
const downloadImage = async function (imgUrl, saveUrl) {
  await axios({
    method: "get",
    url: imgUrl,
    responseType: "stream",
  }).then(function (response) {
    response.data.pipe(fs.createWriteStream(saveUrl));
    logger.info("图片下载成功: " + imgUrl);
  });
};

// 并发处理图片
const processImage = function (saveDir) {
  processImageGrey(saveDir, { quality: 90 });
  processImageResize(saveDir, { width: 16, height: 9, quality: 90, base64: true });
  processImageResize(saveDir, { width: 480, height: 270, quality: 90, base64: false });
  // processImageGauss(saveDir, { pixels: 20, quality: 90 });
};

// ------ 逻辑代码 end------

// ------ 接口 start------
app.get("/update", async function (req, res) {
  saveDir = `${dir}/${dayjs().format("YYYY")}/${dayjs().format(
    "MM"
  )}/${dayjs().format("DD")}`;
  logger.info("当前时间: " + dayjs());
  logger.info("保存目录: " + saveDir);
  await getBingJson();
  await createDirectory(saveDir, true);
  await downloadImage(
    "https://cn.bing.com" + bingJson.images[0].url,
    `${saveDir}/${dayjs().format("YYYY-MM-DD")}_hd.jpg`
  );
  await downloadImage(
    "https://cn.bing.com" + bingJson.images[0].urlbase + "_UHD.jpg",
    `${saveDir}/${dayjs().format("YYYY-MM-DD")}_uhd.jpg`
  );
  processImage(saveDir);
  res.send("正在处理中");
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
// ------ 接口 end------

// 开始监听
app.listen(port, () => {
  logger.info(`app listening at http://localhost:${port}`);
});
