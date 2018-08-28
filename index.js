const WebSocket = require('ws');
const Exec = require('child_process').exec;

const wss = new WebSocket.Server({ port: 44555 })
wss.on('connection', (ws, req) => {
    ws.on('message', message => {
        let data = JSON.parse(message);
        let type = data.type;
        let args = data.args;

        if (type === 'clear') {
            if (process.platform === 'darwin' && process.env.VSCODE_PID) {
                vscode_clear(process.env.VSCODE_PID);
            } else {
                console.clear();
            }
        } else {
            console[type](...args);
        }
    });

    $ = cmd => ws.send(cmd) || '-'.repeat(78);
    $.__proto__ = chain();
})

function chain(props = []) {
    // 用于截获链式调用时有函数调用的形式，$.xxx.yyy(args).zzz，拼装参数
    function func(...args) {
        args = args || [];
        let name = props.pop();
        if (name === 'set') {
            let setValue = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0])
            let cmd = props.reduce((obj, prop) => `${obj}.${prop}`) + ' = ' + setValue;
            return $(cmd);
        } else {
            return chain([...props, name + '(' + args.map(arg => JSON.stringify(arg)).join(',') + ')']);
        }
    }
    func.__proto__ = new Proxy({ props }, {
        get: function (target, key, receiver) {
            if (key === '__proto__') {
                return;
            }
            if (key === 'get') {
                let cmd = props.reduce((obj, prop) => `${obj}.${prop}`);
                return $(cmd);
            } else {
                if (key === '_proto_') {
                    key = '__proto__'
                }
                return chain([...props, key]);
            }
        },
        set: function (target, key, value, receiver) {
            props.push(key);
            let setValue = typeof value === 'string' ? value : JSON.stringify(value)
            let cmd = props.reduce((obj, prop) => `${obj}.${prop}`) + ' = ' + setValue;
            return $(cmd);
        },
        ownKeys(target) {
            return;
        }
    });
    return func;
}

// VS Code 控制台不支持 console.clear，可以先给清空控制台绑定快捷键 CTRL + L 然后通过 AppleScript 发达键盘事件触发
function vscode_clear(pid) {
    let script = `osascript -l JavaScript <<"EOF"\n
ObjC.import('Carbon');

let keyDown = $.CGEventCreateKeyboardEvent($(), 37, true);
$.CGEventSetFlags(keyDown, $.kCGEventFlagMaskControl);

let keyUp = $.CGEventCreateKeyboardEvent($(), 37, false);
$.CGEventSetFlags(keyUp, $.kCGEventFlagMaskControl);

$.CGEventPostToPid(${pid}, keyDown);
delay(0.1);
$.CGEventPostToPid(${pid}, keyUp);
\nEOF
`
    Exec(script, (error, stdout, stderr) => {
        error && console.error(error);
    });
}