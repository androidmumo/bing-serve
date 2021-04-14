// 导入配置文件
const { baseConfig } = require("./config/config");

// 初始化配置项
const { host, port, dir, databaseTable } = baseConfig;

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
const { createDirectory, downloadImage } = require("./model/fileOperations"); // 文件操作模块

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
// ------ 逻辑代码 end------

// ------ 接口 start------
// 静态托管
// 静态托管
app.use("/img", express.static(dir));

app.get("/update", async function (req, res) {
  const saveDir = `${dir}/${dayjs().format("YYYY")}/${dayjs().format(
    "MM"
  )}/${dayjs().format("DD")}`;
  logger.info("当前时间: " + dayjs());
  logger.info("保存目录: " + saveDir);
  let bingJson = await getBingJson();
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
  let mainColor = await getImageMainColor(saveDir);
  let imageBase64 = await getImageBase64(saveDir, {
    width: 16,
    height: 9,
    quality: 90,
  });
  // res.send(imageBase64);
  // let sql = `SELECT * FROM account WHERE username='1'`;
  const SQL_INSERT = `
      INSERT INTO ${databaseTable}
        (title, date, base64, url, color)
      VALUES
        ('${bingJson.images[0].copyright}','${dayjs().format(
    "YYYY-MM-DD"
  )}','${imageBase64}','{"hd":"${
    host + ':' + port + '/' + dir + "/" + dayjs().format("YYYY-MM-DD") + "_uhd.jpg"
  }"}','${JSON.stringify(mainColor)}');
  `;
  operateDb(SQL_INSERT, null).then((result) => {
    console.log(result);
    res.send(result);
  });
});

// ------ 接口 end------

// 开始监听
app.listen(port, () => {
  logger.info(`app listening at ${host}:${port}`);
});
