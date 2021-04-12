// 基础配置
const base = {
  port: 3000, // 服务端口号
  dir: "resources", // 图片保存路径
};

// 数据库配置
const database = {
  host: "192.168.30.130", // 数据库链接地址
  port: "3306", // 数据库连接端口
  database: "testdb", // 数据库名
  user: "apitest", // 数据库用户名
  password: "111111", // 数据库密码
  connectionLimit: 100, // 数据库连接池大小
};

module.exports = {
  base,
  database,
};
