# jsbox\_pc\_logger

JSBox 的桌面端日志打印工具，基于 Node Debugging Inspector，感谢 @Fndroid

## 要求

- Node.js
- VS Code（建议）或 Chrome

## JSBox 加载

- 引入模块

  将仓库目录 `jsboxMoudle` 下的 [socketLogger.js](https://raw.githubusercontent.com/jayqizone/jsbox_pc_debuger/master/jsboxModule/socketLogger.js) 导入 JSBox 的 _ 脚本模块_ 目录下（方便下次使用）

- 使用模块

  在脚本代码入口加入：

```javascript
const socketLogger = require('socketLogger');
'init' in socketLogger && socketLogger.init('192.168.xxx.xxx'); // 桌面端 IP 地址，不能使用 localhost
```

## 调试环境

### Visual Studio Code

1. 在项目中新建文件`.vscode/launch.json`
2. 文件加入如下内容：（其实就是调试运行 `jsbox_pc_logger/index.js`）

	```json
	{
	    "version": "0.2.0",
	    "configurations": [
	        {
	            "type": "node",
	            "request": "launch",
	            "name": "JSBoxLogger",
	            "program": "path to jsbox_pc_logger/index.js"
	        }
	    ]
	}
	```

3. 菜单选择调试-启动调试

### Google Chrome DevTools

1. `node --inspect[=[host:]port] jsbox_pc_logger/index.js`，`host`、`port` 可选
2. 打开 Chrome 浏览器，输入 `chrome://inspect/#devices`，点击界面的 `Open dedicated DevTools for Node` 打开调试工具，注意设置对应 `host`、`port`

## 说明

### 桌面端功能

- 观察 Console 输出

建议使用 VS Code 运行调试，可以在 node 环境下调用暴露出来的 `$` 变量/方法，对 JSBox 脚本环境进行远程调用，使用方法如下：

- `$` 本身即为 ws.send 方法，所以可以用来发送消息（JSBox 环境会 eval 解析执行并返回结果）
- `$.xxx.yyy(args).zzz.get` 以 `get` 结尾进行链式调用，会发送 `$.` 与 `.get` 之间的字符串消息
- `$.xxx.yyy = value` 或 `$.xxx.yyy.set(value)`，会发送赋值语句消息
- VS Code 控制台不响应 `console.clear()` 清屏，如果使用 macOS 系统，则可以先将 _清除控制台_ 绑定快捷键 _CTRL + L_，`jsbox_pc_logger` 会执行一段 AppleScript 发送键盘事件触发此快捷键

![](https://raw.githubusercontent.com/jayqizone/jsbox_pc_debuger/master/images/get.jpg)

![](https://raw.githubusercontent.com/jayqizone/jsbox_pc_debuger/master/images/set.jpg)

### JSBox 参数

socketLogger.init(host, {port = 44555, clear = true, debug = true})

- host: 局域网服务端地址
- port: 局域网服务端端口
- clear: 是否清空 console
- debug: 是否推送日志（打包推送更新时务必设置为 false）