'use strict';

/**
 * Module dependencies
 */
var debug       = require('debug')('mysql-client-pool');
var mysql       = require('mysql');
var BPromise    = require('bluebird');
var genericPool = require('generic-pool');

function MysqlClientPool( options) {
  this.mysql = mysql;
  this.options = options;

  this._pool = MysqlClientPool.createMysqlPool(options);
}

/*
 * Create mysql connection pool.
 */
MysqlClientPool.createMysqlPool = function ( config ) {
  return genericPool.Pool({
    name: config.name,
    create: function ( callback ) {
      var connection = mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        debug: config.debug || false,
        password: config.password,
        database: config.database,
        charset: config.charset,
        typeCast: function ( field, next ) {
          if ( field.type == 'TINY' && field.length == 1 ) {
            return (field.string() == '1'); // 1 = true, 0 = false
          }
          return next();
        }
      });
      callback(null, connection);
    },
    destroy: function ( client ) {
      client.end();
    },
    min: 2,
    max: config.maxConnection || 10,
    idleTimeoutMillis: config.idleTimeoutMillis || 30000,
    log: config.log || false
  });
};

/**
 * Execute sql statement
 * @param {String} sql Statement The sql need to excute.
 * @param {Object} args The args for the sql.
 *
 */
MysqlClientPool.prototype.query = function ( sql, args ) {
  var _pool = this._pool;

  return new BPromise(( resolve, reject ) => {
    _pool.acquire(( err, conn ) => {
      if ( err ) {
        debug('[mysqlConnectionErr] ' + err.stack);
        return reject(new Error('acquire mysql connection error'));
      }

      conn.query(sql, args, function ( err ) {
        _pool.release(conn);
        if ( err ) {
          debug('[mysqlQueryErr] ' + err.stack);
          return reject(new Error('mysql query error'));
        }
        resolve(Array.prototype.slice.call(arguments, 1));
      });
    });
  });
};

/**
 * alias for query
 *
 * @type {Function|*}
 */
MysqlClientPool.prototype.insert = MysqlClientPool.prototype.query;

/**
 * alias for query
 *
 * @type {Function|*}
 */
MysqlClientPool.prototype.update = MysqlClientPool.prototype.query;

/**
 * alias for query
 *
 * @type {Function|*}
 */
MysqlClientPool.prototype.delete = MysqlClientPool.prototype.query;

MysqlClientPool.prototype.format = function () {
  return this.mysql.format.apply(null, arguments);
};

/**
 * Execute sql statement
 * @param {String} sql Statement The sql need to excute.
 * @param {Object} [args] The args for the sql.
 *
 */
MysqlClientPool.prototype.queryRows = function ( sql, args ) {
  var _pool = this._pool;

  return new BPromise(( resolve, reject ) => {
    _pool.acquire(( err, conn ) => {
      if ( err ) {
        debug('[mysqlConnectionErr] ' + err.stack);
        return reject(new Error('acquire mysql connection error'));
      }

      conn.query(sql, args, function ( err ) {
        _pool.release(conn);
        if ( err ) {
          debug('[mysqlQueryErr] ' + err.stack);
          return reject(new Error('mysql query error'));
        }
        resolve(arguments[1]);
      });
    });
  });
};

/**
 * query for count
 *
 * @param sql
 * @param args
 * @param column
 *
 * @returns {Promise<Number>}
 */
MysqlClientPool.prototype.queryCount = function ( sql, args, column ) {
  column = column || 'count';

  return new BPromise(( resolve, reject ) => {
    this.queryRows(sql, args).then(rows => {
      if ( rows && rows.length > 0 ) {
        resolve(rows[0][column] || 0);
      } else {
        resolve(0);
      }
    }).catch(e => {
      reject(e);
    });
  });
};

/**
 * Get sql connection
 *
 * warn: require release connection yourself.
 *
 */
MysqlClientPool.prototype.getConnection = function () {
  var _pool = this._pool;

  return new BPromise(( resolve, reject ) => {
    _pool.acquire(( err, conn ) => {
      if ( err ) {
        return reject(err);
      }
      conn.release = function () {
        _pool.release(conn);
      };
      return resolve(BPromise.promisifyAll(conn));
    });
  });
};

/**
 * Close connection pool.
 */
MysqlClientPool.prototype.shutdown = function () {
  var _pool = this._pool;

  _pool.destroyAllNow();
};


/**
 * exports
 * @type {MysqlClientPool}
 */
module.exports = MysqlClientPool;


