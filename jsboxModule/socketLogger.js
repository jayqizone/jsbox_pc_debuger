module.exports = {
    init: (address, { port = 44555, clear = true, debug = true } = { port: 44555, clear: true, debug: true }) => {
        let proto = console.__proto__;
        let origin = {};
        socket = $socket.new(`ws://${address}:${port}`);

        ['log', 'info', 'warn', 'error', 'clear'].forEach(type => {
            origin[type] = proto[type].bind(console);
            console[type] = (...args) => {
                origin[type](...args);
                debug && socket.send(JSON.stringify({ type, args: preSerialize(...args) }));
            }
        });

        socket.listen({
            didOpen: (sock) => {
                origin.log('Debugger attached.');
                clear && socket.send(JSON.stringify({ type: 'clear' }));
            },
            didFail: (sock, error) => {
                origin.log(`Debugger detached With Error: ${error.localizedDescription}`);
            },
            didClose: (sock, code, reason, wasClean) => {
                origin.log(`Debugger detached with reason: ${reason}`);
            },
            didReceiveString: (sock, cmd) => {
                origin.log(`Inspect: ${cmd}`);
                if (debug) {
                    try {
                        let result = new Function('return eval(`' + $addin.compile(cmd) + '`)')();
                        origin.log(result);
                        socket.send(JSON.stringify({ type: 'log', args: preSerialize(result) }));
                    } catch (error) {
                        origin.error(error.message);
                        socket.send(JSON.stringify({ type: 'error', args: [error.message] }));
                    }
                }
            },
            didReceiveData: (sock, data) => {
                origin.log(`Received: ${data}`);
            },
            didReceivePing: (sock, data) => {
                origin.log('WebSocket received ping');
            },
            didReceivePong: (sock, data) => {
                origin.log('WebSocket received pong');
            }
        });

        socket.open();
    }
}

function preSerialize(...args) {
    return args.map(arg => analyzeObject(arg));
}

function analyzeObject(obj) {
    if (obj instanceof Array) {
        return preSerialize(...obj);
    }
    if (obj instanceof Function) {
        return `${obj}`;
    }
    if (obj instanceof Object) {
        if (/\[object (?!Object)/.test(obj.toString())) {
            return obj.runtimeValue().$description().rawValue();
        } else {
            for (let key in obj) {
                obj[key] = analyzeObject(obj[key]);
            }
        }
    }
    return obj;
}
