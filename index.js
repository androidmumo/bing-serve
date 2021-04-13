// 导入配置文件
const { base } = require("./config/config");

// 导入模块
const {
  processImageGrey,
  processImageGauss,
  processImageResize,
  processImageBase64,
} = require("./model/processImage"); // 图片处理模块
const { logger } = require("./model/log4js"); // 日志模块
const { addContent } = require("./model/conn"); // 数据库模块
const { getBingJson } = require("./model/request"); // 请求外部接口模块
const { createDirectory, downloadImage } = require("./model/fileOperations"); // 文件操作模块

// 使用express框架
const express = require("express");
const app = new express();

// 第三方模块
const dayjs = require("dayjs");

// ------ 逻辑代码 start------
// 定义变量
const { port, dir } = base;

// 并发处理图片
const processImage = function (saveDir) {
  processImageGrey(saveDir, { quality: 90 });
  processImageBase64(saveDir, {
    width: 16,
    height: 9,
    quality: 90,
  }).then((base64Image) => {
    logger.debug(base64Image);
  });
  processImageResize(saveDir, {
    width: 480,
    height: 270,
    quality: 90,
  });
  // processImageGauss(saveDir, { pixels: 20, quality: 90 });
};

// ------ 逻辑代码 end------

// ------ 接口 start------
app.get("/update", async function (req, res) {
  const saveDir = `${dir}/${dayjs().format("YYYY")}/${dayjs().format(
    "MM"
  )}/${dayjs().format("DD")}`;
  let bingJson = {};
  logger.info("当前时间: " + dayjs());
  logger.info("保存目录: " + saveDir);
  await getBingJson().then((res) => {
    bingJson = res;
  });
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
  // res.send("正在处理中");
  let sql = `SELECT * FROM account WHERE username='1'`;
  addContent(sql, null).then((result) => {
    console.log(result);
    res.send(result);
  });
});

// ------ 接口 end------

// 开始监听
app.listen(port, () => {
  logger.info(`app listening at http://localhost:${port}`);
});
