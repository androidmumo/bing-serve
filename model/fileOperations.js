// 文件操作模块

// 导入模块
const { logger } = require("./log4js"); // 日志模块

// 原生模块
const fs = require("fs");

// 第三方模块
const axios = require("axios");

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

module.exports = {
  createDirectory,
  downloadImage,
};
