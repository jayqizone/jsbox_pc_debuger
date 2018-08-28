module.exports = {
    init: (address, { port = 44555, clear = true, debug = true } = { port: 44555, clear: true, debug: true }) => {
        let origin = console.__proto__;
        socket = $socket.new(`ws://${address}:${port}`);
        socket.listen({
            didOpen: (sock) => {
                clear && socket.send(JSON.stringify({ type: 'clear' }));
                origin.log.call(console, "Debugger attached.");
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
                        let result = new Function(`return eval(\`` + $addin.compile(cmd) + `\`)`)();
                        socket.send(JSON.stringify({ type: 'log', args: [result] }));
                        origin.log.call(console, result);
                    } catch (error) {
                        socket.send(JSON.stringify({ type: 'error', args: [error.message] }));
                        origin.error.call(console, error.message);
                    }
                }
            },
            didReceiveData: (sock, data) => {
                origin.log.call(console, `Received: ${data}`);
            },
            didReceivePing: (sock, data) => {
                origin.log.call(console, "WebSocket received ping");
            },
            didReceivePong: (sock, data) => {
                origin.log.call(console, "WebSocket received pong");
            }
        });
        socket.open();

        ['log', 'info', 'warn', 'error', 'clear'].forEach(type => console[type] = function (...args) {
            debug && socket.send(JSON.stringify({ type, args }));
            origin[type].apply(console, args);
        });
    }
}