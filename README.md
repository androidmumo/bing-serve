# bing-serve

### 使用 node.js 构建的必应每日一图服务端

> 前端仓库: https://github.com/androidmumo/bing-vue



### 环境准备

- 本项目基于 `Node.js 14` 开发，建议运行环境的Node版本大于此版本
- MySql



### 配置

先在 `config/config.js` 下配置域名、端口号、数据库等信息:

```
// 基础配置
const baseConfig = {
  host: "http://localhost", // 域名 (首尾不能为’/‘)
  port: 3000, // 服务端口号
  dir: "resources", // 图片保存路径 (相对于根目录、首尾不能为’/‘)
  databaseTable: "bing", // 数据库表名
};

// 数据库配置
const databaseConfig = {
  host: "192.168.30.130", // 数据库链接地址
  port: "3306", // 数据库连接端口
  database: "testdb", // 数据库名
  user: "apitest", // 数据库用户名
  password: "111111", // 数据库密码
  connectionLimit: 100, // 数据库连接池大小
};
```



### 安装

##### 安装依赖

```
npm install
```

##### 执行 `bing-serve` 的安装程序

```
npm run install
```



### 启动

```
npm run serve
```

