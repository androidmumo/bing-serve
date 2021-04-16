// 定时任务

// 引入配置文件
const { baseConfig } = require("../config/config");

// 初始化配置项
let { updateTime } = baseConfig;

// 引入模块
const { eventBus } = require("./eventBus"); // 事件总线

// 第三方模块
const CronJob = require("cron").CronJob;

// 处理updateTime
const updateTimeArr = updateTime.split(":");
const updateTimeCron = `${updateTimeArr[2]} ${updateTimeArr[1]} ${updateTimeArr[0]} * * *`;

// 每天的凌晨 0点0分0秒触发  （每天触发一次）
const updateJob = new CronJob(updateTimeCron, function () {
  eventBus.emit("to-update");
});

// 实例化定时任务
const startUpdateJob = function () {
  updateJob.start();
};

module.exports = {
  startUpdateJob,
};
