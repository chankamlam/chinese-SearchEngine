"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Search = exports.cutWords = exports.addUUID = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _redis = require("redis");

var _redis2 = _interopRequireDefault(_redis);

var _async = require("async");

var _async2 = _interopRequireDefault(_async);

var _util = require("util");

var _util2 = _interopRequireDefault(_util);

var _nodejieba = require("nodejieba");

var _nodejieba2 = _interopRequireDefault(_nodejieba);

var _v = require("uuid/v4");

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var redisClient = void 0;
var option = {
    host: '127.0.0.1',
    port: 6379
    /**
     * 删除所有现存分词KEY
     * @param  {fn} cbk 
     */
};var clearAllKeys = function clearAllKeys(cbk) {
    if (!redisClient) {
        return;
    }
    var a = function a(cb) {
        redisClient.keys('*', function (err, r) {
            if (err) {
                cb("err in get all keys from redis");
                return;
            };
            cb(null, r);
        });
    };
    var b = function b(n, cb) {
        redisClient.del(n, function (err, r) {
            if (err) {
                cb("err in delete all keys from redis");
                return;
            };
            cb(null);
        });
    };
    async.waterfall([a, b], function (err, r) {
        if (err) {
            throw new Error('err in fn clearAllKeys');
            return;
        };
        cbk();
    });
};
/**
 * 初始化RedisClient
 */
var initRedisClient = function initRedisClient(opt) {
    if (!redisClient) {
        redisClient = _redis2.default.createClient({
            'host': opt.host,
            'port': opt.port
        });
    };
};
/**
 * 按照KEY分词
 * @param  {array} cutKeys 
 * @param  {array} d     
 */
var cutWords = function cutWords(cutKeys, d) {
    var n = {};
    cutKeys.forEach(function (key) {
        d.forEach(function (obj) {
            if (obj[key]) {
                var words = _nodejieba2.default.cut(obj[key]);
                words.forEach(function (w) {
                    if (!n[w]) {
                        n[w] = new Set();
                    }
                    n[w].add(obj['_id']);
                });
            }
        });
    });
    return n;
};
/**
 * 添加唯一键
 * @param  {array} d 需要处理数组
 * @return {array}   处理过数组
 */
var addUUID = function addUUID(d) {
    return d.map(function (obj) {
        obj['_id'] = (0, _v2.default)();
        return obj;
    });
};

var Search = function () {
    function Search(args) {
        _classCallCheck(this, Search);

        this.opt = Object.assign({}, option, args);
        // initRedisClient(this.opt)
    }
    /**
     * 需要进行分词KEY
     * @param  {Array} arr 
     */


    _createClass(Search, [{
        key: "cutKeys",
        value: function cutKeys(arr) {
            if (_util2.default.isArray(arr)) {
                option['cutKeys'] = arr;
            }
            return this;
        }
    }, {
        key: "data",
        value: function data(d, done) {
            var isAddedData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            if (_util2.default.isArray(d)) {
                //非追加数据清理所有KEY对应UUID
                var a = function a(cb) {
                    if (isAddedData) {
                        clearAllKeys(function () {
                            cb(null, {});
                        });
                    }
                };
                //添加UUID
                var b = function b(n, cb) {
                    n.d = addUUID(d);
                    cb(null, n);
                };
                // 分词
                var c = function c(n, cb) {
                    n = cutWords(option.cutKeys, n.d);
                    cb(null, n);
                };
                // 保存到redis
                _async2.default.waterfall([a, b, c], function (err, r) {
                    if (err) {
                        throw new Error("err in method data");
                        return;
                    }
                    if (done) {
                        done();
                    }
                });
            }
            return this;
        }
    }, {
        key: "addData",
        value: function addData(d, done) {
            data(d, done, true);
            return this;
        }
    }]);

    return Search;
}();

exports.addUUID = addUUID;
exports.cutWords = cutWords;
exports.Search = Search;