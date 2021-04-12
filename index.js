// 导入配置文件
const { base, database } = require("./config/config");

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
const Jimp = require("jimp");

// ------ 逻辑代码 start------
// 定义变量
let log = "";
let bingJson = {};
let nowTime = "";
let saveDir = "";

// 创建一个数据库连接池
let pool = mysql.createPool(database);

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

// 写入日志文件
const createLogFile = function (log) {
  let writeStream = fs.createWriteStream(
    `${saveDir}/${dayjs(nowTime).format("YYYY-MM-DD")}_log.txt`
  );
  writeStream.write(log);
};

// 请求接口 获取bing官方JSON数据
const getBingJson = async function () {
  await axios({
    method: "get",
    url:
      "https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN",
  }).then((response) => {
    bingJson = response.data;
    log += `${dayjs().format("YYYY-MM-DD HH:mm:ss:SSS")} 获取bingJson成功\n`;
  });
};

// 创建目录
const createDirectory = async function (dir, recursive) {
  await fs.mkdir(dir, { recursive }, function (error) {
    if (error) {
      console.log(error);
      log += `${dayjs().format(
        "YYYY-MM-DD HH:mm:ss:SSS"
      )} 创建目录失败: ${error}\n`;
      return false;
    }
    log += `${dayjs().format(
      "YYYY-MM-DD HH:mm:ss:SSS"
    )} 创建目录成功: ${dir}\n`;
  });
};

// 下载图片
const downloadImage = async function (imgUrl, saveDir) {
  await axios({
    method: "get",
    url: imgUrl,
    responseType: "stream",
  }).then(function (response) {
    response.data.pipe(fs.createWriteStream(saveDir));
    log += `${dayjs().format(
      "YYYY-MM-DD HH:mm:ss:SSS"
    )} 图片下载成功: ${imgUrl}\n`;
  });
};

// 处理图片 灰度
const processImageGrey = function ({ quality }) {
  Jimp.read(`${saveDir}/${dayjs(nowTime).format("YYYY-MM-DD")}_hd.jpg`)
    .then((img) => {
      return img
        .greyscale() // set greyscale
        .quality(quality)
        .write(
          `${saveDir}/${dayjs(nowTime).format("YYYY-MM-DD")}_hd_greyscale.jpg`
        ); // save
    })
    .catch((err) => {
      log += `${dayjs().format(
        "YYYY-MM-DD HH:mm:ss:SSS"
      )} 图片处理失败: 灰度 ${err}\n`;
      createLogFile(log);
    })
    .then(() => {
      log += `${dayjs().format(
        "YYYY-MM-DD HH:mm:ss:SSS"
      )} 图片处理成功: 灰度\n`;
      createLogFile(log);
    });
};

// 处理图片 高斯模糊
const processImageGauss = function (pixels, { quality }) {
  Jimp.read(`${saveDir}/${dayjs(nowTime).format("YYYY-MM-DD")}_hd.jpg`)
    .then((img) => {
      return img
        .quality(quality)
        .gaussian(pixels) // set greyscale
        .write(
          `${saveDir}/${dayjs(nowTime).format(
            "YYYY-MM-DD"
          )}_hd_gaussian_${pixels}.jpg`
        ); // save
    })
    .catch((err) => {
      log += `${dayjs().format(
        "YYYY-MM-DD HH:mm:ss:SSS"
      )} 图片处理失败: 高斯模糊 ${err}\n`;
      createLogFile(log);
    })
    .then(() => {
      log += `${dayjs().format(
        "YYYY-MM-DD HH:mm:ss:SSS"
      )} 图片处理成功: 高斯模糊${pixels}\n`;
      createLogFile(log);
    });
};

// 处理图片 缩放 质量 (参数base64若为true，则产生base64编码的图片)
const processImageResize = function (width, height, { quality, base64 }) {
  Jimp.read(`${saveDir}/${dayjs(nowTime).format("YYYY-MM-DD")}_hd.jpg`)
    .then((img) => {
      return base64
        ? img
            .resize(width, height) // set greyscale
            .quality(quality)
            .getBase64(Jimp.AUTO, (err, base64Image) => {
              console.log(base64Image);
            })
        : img
            .resize(width, height) // set greyscale
            .quality(quality)
            .write(
              `${saveDir}/${dayjs(nowTime).format(
                "YYYY-MM-DD"
              )}_hd_thumbnail_${width}_${height}.jpg`
            ); // save
    })
    .catch((err) => {
      log += `${dayjs().format(
        "YYYY-MM-DD HH:mm:ss:SSS"
      )} 图片处理失败: 缩放 ${err}\n`;
      createLogFile(log);
    })
    .then(() => {
      log += `${dayjs().format(
        "YYYY-MM-DD HH:mm:ss:SSS"
      )} 图片处理成功: 缩放 ${width} ${height}\n`;
      createLogFile(log);
    });
};

// ------ 逻辑代码 end------

// ------ 接口 start------
app.get("/update", async function (req, res) {
  nowTime = new Date();
  saveDir = `${dir}/${dayjs(nowTime).format("YYYY")}/${dayjs(nowTime).format(
    "MM"
  )}/${dayjs(nowTime).format("DD")}`;
  log = `当前时间(nowTime): ${nowTime}\n保存目录: ${saveDir}\n`;
  await getBingJson();
  await createDirectory(saveDir, true);
  await downloadImage(
    "https://cn.bing.com" + bingJson.images[0].url,
    `${saveDir}/${dayjs(nowTime).format("YYYY-MM-DD")}_hd.jpg`
  );
  await downloadImage(
    "https://cn.bing.com" + bingJson.images[0].urlbase + "_UHD.jpg",
    `${saveDir}/${dayjs(nowTime).format("YYYY-MM-DD")}_uhd.jpg`
  );
  await processImageGrey({ quality: 90 });
  await processImageGauss(20, { quality: 90 });
  await processImageResize(16, 9, { quality: 90, base64: true });
  await processImageResize(480, 270, { quality: 90, base64: false });
  res.send(log);
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
  console.log(`Example app listening at http://localhost:${port}`);
});
