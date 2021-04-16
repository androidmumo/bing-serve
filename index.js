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
const { eventBus } = require("./model/eventBus"); // 事件总线
const { startUpdateJob } = require("./model/cron"); // 定时任务

// 使用express框架
const express = require("express");
const app = new express();

// 第三方模块
const dayjs = require("dayjs");
const cors = require("cors");

// ------ 逻辑代码 start------
// 错误收集器
let errorList = []; // 错误列表
let retryTime = 0; // 重试次数
eventBus.on("on-error", (error) => {
  errorList.push(error);
});

// 定时任务
startUpdateJob();
eventBus.on("to-update", () => {
  updateBing();
});

// 并发处理图片
const processImage = function (saveDir) {
  processImageGrey(saveDir, { quality: 90 });
  processImageResize(saveDir, {
    width: 480,
    height: 270,
    quality: 90,
  });
  processImageGauss(saveDir, { pixels: 20, quality: 90 });
};

// 新增/更新
const updateBing = async function () {
  const saveDir = `${dir}/${dayjs().format("YYYY")}/${dayjs().format(
    "MM"
  )}/${dayjs().format("DD")}`;
  logger.info("当前时间: " + dayjs());
  logger.info("保存目录: " + saveDir);
  // 获取bing官方数据
  let bingJson = await getBingJson();
  // 创建目录
  await createDirectory(saveDir, true);
  // 下载图片
  await downloadImageAsync(
    "https://cn.bing.com" + bingJson.images[0].url,
    `${saveDir}/${dayjs().format("YYYY-MM-DD")}_hd.jpg`
  );
  downloadImage(
    "https://cn.bing.com" + bingJson.images[0].urlbase + "_UHD.jpg",
    `${saveDir}/${dayjs().format("YYYY-MM-DD")}_uhd.jpg`
  );
  // 处理图片
  processImage(saveDir);
  // 变量准备
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
  // 写入数据库
  if ((await operateDb(SQL_CHECK, null)).data.length === 0) {
    await operateDb(SQL_INSERT, null).then((result) => {
      logger.info("数据库-写入成功");
    });
  } else {
    await operateDb(SQL_UPDATE, null).then((result) => {
      logger.info("数据库-更新成功");
    });
  }
  // 重试逻辑
  if (errorList.length === 0) {
    logger.info("成功");
    // res.send("成功");
  } else {
    if (retryTime >= 3) {
      retryTime = 0;
      logger.error("失败 " + errorList);
      return;
    }
    retryTime++;
    logger.error("发生了错误,正在重试中 次数: " + retryTime);
    errorList = [];
    setTimeout(function () {
      updateBing();
    }, 10000);
  }
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

// 跨域
app.use(cors());

// 更新图片
app.get(`/${UPDATE}`, updateBing);

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
