// 图片处理函数
// 导入模块
const { logger } = require("./log4js");

// 导入第三方模块
const dayjs = require("dayjs");
const Jimp = require("jimp");

// 处理图片 灰度
const processImageGrey = function (saveDir, { quality }) {
  Jimp.read(`${saveDir}/${dayjs().format("YYYY-MM-DD")}_hd.jpg`)
    .then((img) => {
      return img
        .greyscale() // set greyscale
        .quality(quality)
        .write(`${saveDir}/${dayjs().format("YYYY-MM-DD")}_hd_greyscale.jpg`); // save
    })
    .catch((err) => {
      logger.error("图片处理失败: 灰度 " + err);
    })
    .then(() => {
      logger.info("图片处理成功: 灰度");
    });
};

// 处理图片 高斯模糊
const processImageGauss = function (saveDir, { pixels, quality }) {
  Jimp.read(`${saveDir}/${dayjs().format("YYYY-MM-DD")}_hd.jpg`)
    .then((img) => {
      return img
        .quality(quality)
        .gaussian(pixels) // set greyscale
        .write(
          `${saveDir}/${dayjs().format("YYYY-MM-DD")}_hd_gaussian_${pixels}.jpg`
        ); // save
    })
    .catch((err) => {
      logger.error("图片处理失败: 高斯模糊 " + err);
    })
    .then(() => {
      logger.info("图片处理成功: 高斯模糊");
    });
};

// 处理图片 缩放 质量 (参数base64若为true，则产生base64编码的图片)
const processImageResize = function (
  saveDir,
  { width, height, quality, base64 }
) {
  Jimp.read(`${saveDir}/${dayjs().format("YYYY-MM-DD")}_hd.jpg`)
    .then((img) => {
      return base64
        ? img
            .resize(width, height) // set greyscale
            .quality(quality)
            .getBase64(Jimp.AUTO, (err, base64Image) => {
              logger.debug(base64Image);
            })
        : img
            .resize(width, height) // set greyscale
            .quality(quality)
            .write(
              `${saveDir}/${dayjs().format(
                "YYYY-MM-DD"
              )}_hd_thumbnail_${width}_${height}.jpg`
            ); // save
    })
    .catch((err) => {
      logger.error("图片处理失败: 缩放 " + err);
    })
    .then(() => {
      logger.info(`图片处理成功: 缩放 width:${width} height:${height}`);
    });
};

module.exports = {
  processImageGrey,
  processImageGauss,
  processImageResize,
};
