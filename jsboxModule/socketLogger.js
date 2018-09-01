module.exports = {
    init: (address, { port = 44555, clear = true, debug = true } = { port: 44555, clear: true, debug: true }) => {
        let origin = console.__proto__;
        socket = $socket.new(`ws://${address}:${port}`);
        socket.listen({
            didOpen: (sock) => {
                origin.log.call(console, 'Debugger attached.');
                clear && socket.send(JSON.stringify({ type: 'clear' }));
            },
            didFail: (sock, error) => {
                origin.error.call(console, `Debugger detached With Error: ${error.localizedDescription}`);
            },
            didClose: (sock, code, reason, wasClean) => {
                origin.log.call(console, `Debugger detached with reason: ${reason}`);
            },
            didReceiveString: (sock, cmd) => {
                origin.log.call(console, `Inspect: ${cmd}`);
                if (debug) {
                    try {
                        let result = new Function('return eval(`' + $addin.compile(cmd) + '`)')();
                        origin.log.call(console, result);
                        socket.send(JSON.stringify({ type: 'log', args: [result] }));
                    } catch (error) {
                        origin.error.call(console, error.message);
                        socket.send(JSON.stringify({ type: 'error', args: [error.message] }));
                    }
                }
            },
            didReceiveData: (sock, data) => {
                origin.log.call(console, `Received: ${data}`);
            },
            didReceivePing: (sock, data) => {
                origin.log.call(console, 'WebSocket received ping');
            },
            didReceivePong: (sock, data) => {
                origin.log.call(console, 'WebSocket received pong');
            }
        });
        socket.open();

        ['log', 'info', 'warn', 'error', 'clear'].forEach(type => console[type] = function (...args) {
            origin[type].apply(console, args);
            debug && socket.send(JSON.stringify({ type, args }));
        });
    }
}