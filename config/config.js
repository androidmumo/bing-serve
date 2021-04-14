// 基础配置
const baseConfig = {
  host: "http://localhost", // 域名 (首尾不能为’/‘)
  port: 3000, // 服务端口号
  dir: "resources", // 图片保存路径 (相对于根目录、首尾不能为’/‘)
  databaseTable: "bing", // 数据库表名
};

// 数据库配置
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
};
