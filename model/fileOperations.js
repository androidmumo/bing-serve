// 文件操作模块

// 导入模块
const { logger } = require("./log4js"); // 日志模块
const { eventBus } = require("./eventBus"); // 事件总线

// 原生模块
const fs = require("fs");

// 第三方模块
const Jimp = require("jimp");

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

// 下载图片
const downloadImage = function (imgUrl, saveUrl) {
  Jimp.read({
    url: imgUrl,
  })
    .then((img) => {
      logger.info("图片下载成功: " + imgUrl);
      return img.write(saveUrl);
    })
    .catch((err) => {
      eventBus.emit("on-error", "downloadImage");
      logger.error("图片下载失败: " + err);
    });
};

// 同步下载图片
const downloadImageAsync = async function (imgUrl, saveUrl) {
  await Jimp.read({
    url: imgUrl,
  })
    .then((img) => {
      logger.info("图片下载成功(async): " + imgUrl);
      return img.writeAsync(saveUrl);
    })
    .catch((err) => {
      eventBus.emit("on-error", "downloadImageAsync");
      logger.error("图片下载失败(async): " + err);
    });
};

module.exports = {
  createDirectory,
  downloadImage,
  downloadImageAsync,
};
