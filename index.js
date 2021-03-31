// 设置express框架
const express = require("express");
const app = new express();
const port = 3000;

// 引入第三方组件
var mysql = require("mysql");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
