// 导入配置文件
const {
  baseConfig,
  installConfig,
  apiBaseConfig,
  apiConfig,
} = require("./config/config");

// 初始化配置项
const { port, dir } = baseConfig;
const { databaseTable } = installConfig;
const { static } = apiBaseConfig;
const { UPDATE, GET_LIST } = apiConfig;

// 导入模块
const { logger } = require("./model/log4js"); // 日志模块
const { operateDb } = require("./model/conn"); // 数据库模块
const { eventBus } = require("./model/eventBus"); // 事件总线
const { startUpdateJob } = require("./model/cron"); // 定时任务

// 原生模块
const childProcess = require("child_process");

// 使用express框架
const express = require("express");
const app = new express();

// 第三方模块
const cors = require("cors");

// ------ 逻辑代码 start------
// 定时任务
startUpdateJob();
eventBus.on("to-update", () => {
  updateBingByChildProcess();
});

// 用子进程更新图片
const updateBingByChildProcess = function () {
  childProcess.fork("./model/update.js");
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
app.get(`/${UPDATE}`, updateBingByChildProcess);

// 获取图片列表
app.get(`/${GET_LIST}`, function (req, res) {
  // sql注入过滤
  let pageSize = isNaN(parseInt(req.query?.pageSize))
    ? 1
    : parseInt(req.query?.pageSize);
  let currentPage = isNaN(parseInt(req.query?.currentPage))
    ? 0
    : parseInt(req.query?.currentPage) - 1;
  // 限制查询范围
  if (pageSize <= 0) {
    pageSize = 1;
  }
  if (currentPage <= 0) {
    currentPage = 1;
  }
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
  logger.info(`app listening at http://localhost:${port}`);
});
