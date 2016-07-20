# mysql-client-pool

[![npm version](https://badge.fury.io/js/mysql-client-pool.svg)](https://badge.fury.io/js/mysql-client-pool)

> Mysql client pool which support promise api and auto manage connection pool.

## Install

[![NPM](https://nodei.co/npm/mysql-client-pool.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/mysql-client-pool/)

```bash
$ npm i --save mysql-client-pool
```

## Usage

```js
var MysqlClientPool = require('mysql-client-pool');

var options = {};
var mysqlClientPool = new MysqlClientPool(options);

var sql = 'select * from users limit 0,20';
mysqlClientPool.query(sql).then(function (results) {
  // 
});
```

## Options

todo

## Licences

[MIT](LICENSE)