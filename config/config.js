// 配置文件 config.js

// 基础配置
const baseConfig = {
  host: "http://localhost", // 域名 (首尾不能为’/‘)
  port: 3000, // 服务端口号
  dir: "resources", // 图片真实保存路径 (相对于根目录、首尾不能为’/‘)
  static: "img", // 图片静态托管路径 (url访问图片时的路径、首尾不能为’/‘)
  updateTime: "00:01:00", // 每天更新时间
  databaseTable: "bing", // 数据库表名 (可在安装前更改)
};

// API配置(接口url后缀、首尾不能为’/‘)
const apiConfig = {
  UPDATE: "update", // 手动更新图片
  GET_LIST: "getList", // 获取图片列表
};

// 数据库配置 (注意：除数据库连接池大小外，以下配置项提及的内容需在安装前准备好并填入)
const databaseConfig = {
  host: "localhost", // 数据库链接地址
  port: "3306", // 数据库连接端口
  database: "testdb", // 数据库名
  user: "root", // 数据库用户名
  password: "11111111", // 数据库密码
  connectionLimit: 100, // 数据库连接池大小
};

module.exports = {
  baseConfig,
  databaseConfig,
  apiConfig,
};
