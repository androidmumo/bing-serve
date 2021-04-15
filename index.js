// 导入配置文件
const { baseConfig, apiConfig } = require("./config/config");

// 初始化配置项
const { host, port, dir, static, databaseTable } = baseConfig;
const { UPDATE, GET_LIST } = apiConfig;

// 导入模块
const {
  processImageGrey,
  processImageGauss,
  processImageResize,
  getImageBase64,
  getImageMainColor,
} = require("./model/processImage"); // 图片处理模块
const { logger } = require("./model/log4js"); // 日志模块
const { operateDb } = require("./model/conn"); // 数据库模块
const { getBingJson } = require("./model/request"); // 请求外部接口模块
const {
  createDirectory,
  downloadImage,
  downloadImageAsync,
} = require("./model/fileOperations"); // 文件操作模块

// 使用express框架
const express = require("express");
const app = new express();

// 第三方模块
const dayjs = require("dayjs");

// ------ 逻辑代码 start------
// 并发处理图片
const processImage = function (saveDir) {
  processImageGrey(saveDir, { quality: 90 });
  processImageResize(saveDir, {
    width: 480,
    height: 270,
    quality: 90,
  });
  // processImageGauss(saveDir, { pixels: 20, quality: 90 });
};

// 处理数据库返回值
const reduceRes = function (result) {
  result.forEach((item) => {
    item.url = JSON.parse(item.url);
    item.color = JSON.parse(item.color);
  });
  return result;
};
// ------ 逻辑代码 end------

// ------ 接口 start------
// 静态托管
app.use(`/${static}`, express.static(dir));

// 更新图片
app.get(`/${UPDATE}`, async function (req, res) {
  const saveDir = `${dir}/${dayjs().format("YYYY")}/${dayjs().format(
    "MM"
  )}/${dayjs().format("DD")}`;
  logger.info("当前时间: " + dayjs());
  logger.info("保存目录: " + saveDir);
  let bingJson = await getBingJson();
  await createDirectory(saveDir, true);
  await downloadImageAsync(
    "https://cn.bing.com" + bingJson.images[0].url,
    `${saveDir}/${dayjs().format("YYYY-MM-DD")}_hd.jpg`
  );
  downloadImage(
    "https://cn.bing.com" + bingJson.images[0].urlbase + "_UHD.jpg",
    `${saveDir}/${dayjs().format("YYYY-MM-DD")}_uhd.jpg`
  );
  processImage(saveDir);
  const mainColor = await getImageMainColor(saveDir);
  const imageBase64 = await getImageBase64(saveDir, {
    width: 16,
    height: 9,
    quality: 90,
  });
  const baseImgUrl = `${host}:${port}/${static}/${dayjs().format(
    "YYYY"
  )}/${dayjs().format("MM")}/${dayjs().format("DD")}/${dayjs().format(
    "YYYY-MM-DD"
  )}`;
  const urlObj = {
    hd: `${baseImgUrl}_hd.jpg`,
    uhd: `${baseImgUrl}_uhd.jpg`,
    greyscale: `${baseImgUrl}_hd_greyscale.jpg`,
    thumbnail: `${baseImgUrl}_hd_thumbnail_480_270.jpg`,
    gaussian: `${baseImgUrl}_hd_gaussian_20.jpg`,
  };
  const SQL_CHECK = `SELECT * FROM ${databaseTable}
  WHERE date='${dayjs().format("YYYY-MM-DD")}'`;
  const SQL_INSERT = `
      INSERT INTO ${databaseTable}
        (title, date, base64, url, color)
      VALUES
        ('${bingJson.images[0].copyright}',
        '${dayjs().format("YYYY-MM-DD")}',
        '${imageBase64}',
        '${JSON.stringify(urlObj)}',
        '${JSON.stringify(mainColor)}');
  `;
  const SQL_UPDATE = `
      UPDATE ${databaseTable} SET
        title='${bingJson.images[0].copyright}',
        base64='${imageBase64}',
        url='${JSON.stringify(urlObj)}',
        color='${JSON.stringify(mainColor)}'
      WHERE date='${dayjs().format("YYYY-MM-DD")}'
  `;
  if ((await operateDb(SQL_CHECK, null)).data.length === 0) {
    operateDb(SQL_INSERT, null)
      .then((result) => {
        logger.info("数据写入成功 插入条数: " + result.data.affectedRows);
        res.send("数据写入成功 插入条数: " + result.data.affectedRows);
      })
      .catch((err) => {
        logger.error("数据写入失败 " + err);
        res.send("数据写入失败 " + err);
      });
  } else {
    operateDb(SQL_UPDATE, null)
      .then((result) => {
        logger.info("数据更新成功 更新详情: " + result.data.message);
        res.send("数据更新成功 更新详情: " + result.data.message);
      })
      .catch((err) => {
        logger.error("数据更新失败 " + err);
        res.send("数据更新失败 " + err);
      });
  }
});

// 获取图片列表
app.get(`/${GET_LIST}`, function (req, res) {
  const pageSize = req.query?.pageSize;
  const currentPage = req.query?.currentPage - 1;
  const SQL_GET_LIST = `
  SELECT *
  FROM ${databaseTable}
  ORDER BY id DESC
  LIMIT ${pageSize} OFFSET ${currentPage * pageSize};`;
  const SQL_GET_TOTLE = `SELECT COUNT(*) totle FROM ${databaseTable};`;
  const list = operateDb(SQL_GET_LIST, null);
  const totle = operateDb(SQL_GET_TOTLE, null);
  Promise.all([totle, list])
    .then((values) => {
      res.send({
        totle: values[0].data[0].totle,
        list: reduceRes(values[1].data),
      });
    })
    .catch((err) => {
      logger.error("发生了错误 " + err.data);
      res.send("发生了错误 " + err.data);
    });
});

// ------ 接口 end------

// 开始监听
app.listen(port, () => {
  logger.info(`app listening at ${host}:${port}`);
});
