// 事件总线
const EventEmitter = require('events');

class ErrEmitter extends EventEmitter {}

const errEmitter = new ErrEmitter();

module.exports = {
    errEmitter
};
