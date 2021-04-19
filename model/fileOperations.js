// 文件操作模块

// 导入模块
const { logger } = require("./log4js"); // 日志模块
const { eventBus } = require("./eventBus"); // 事件总线

// 原生模块
const fs = require("fs");

// 第三方模块
const axios = require("axios");

// 创建目录
const createDirectory = async function (dir, recursive) {
  await fs.mkdir(dir, { recursive }, function (error) {
    if (error) {
      eventBus.emit("on-error", "createDirectory");
      logger.error("创建目录失败 " + error);
      return false;
    }
    logger.info("创建目录成功: " + dir);
  });
};

// 同步创建目录
const createDirectorySync = function (dir, recursive) {
  fs.mkdirSync(dir, { recursive });
};

// 下载图片
const downloadImage = function (imgUrl, saveUrl) {
  axios({
    method: "get",
    url: imgUrl,
    responseType: "stream",
  })
    .then(function (response) {
      response.data.pipe(fs.createWriteStream(saveUrl));
      logger.info("图片下载成功: " + imgUrl);
    })
    .catch((err) => {
      console.log(err);
      logger.error("图片下载失败 " + err);
    });
};

// 同步下载图片
function downloadImageSync(imgUrl, saveUrl) {
  return new Promise((resolve, reject) => {
    var writeStream = fs.createWriteStream(saveUrl);
    axios({
      method: "get",
      url: imgUrl,
      responseType: "stream",
    }).then(function (response) {
      response.data.pipe(writeStream);
    });
    writeStream.on("error", (err) => {
      logger.error("图片下载失败 " + err);
      reject(err);
    });
    writeStream.on("finish", () => {
      logger.info("图片下载成功: " + imgUrl);
      writeStream.end();
      resolve(true);
    });
  });
}

module.exports = {
  createDirectory,
  createDirectorySync,
  downloadImage,
  downloadImageSync,
};
