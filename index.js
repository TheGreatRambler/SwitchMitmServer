const Proxy = require("http-mitm-proxy");
const path = require("path");
const net = require("net");
const fs = require("fs");
const msgpack = require("@msgpack/msgpack");
const ip = require("ip");

var proxy = Proxy();

/*
var logStream = fs.createWriteStream(path.join(__dirname, "outputlog.txt"), {
	flags: 'w'
});
process.stdout.write = process.stderr.write = logStream.write.bind(logStream);
*/

/*
proxy.onConnect(function(req, socket, head) {
	console.log("CONNECT: " + req.url + " " + req.method);

	var host = req.url.split(":")[0];
	var port = req.url.split(":")[1];

	console.log("TUNNEL: " + req.url);

	var conn = net.connect({
			port: port,
			host: host,
			allowHalfOpen: true
		},
		function() {
			conn.on('finish', () => {
				socket.destroy();
			});

			socket.on('close', () => {
				conn.end();
			});

			socket.on('data', (data) => {
				console.log("FROM SOCKET: " + data.toString("ascii") + "\n");
			});

			conn.on('data', (data) => {
				console.log("FROM CONN: " + data.toString("ascii") + "\n");
			});

			socket.write('HTTP/1.1 200 OK\r\n\r\n', 'UTF-8', function() {
				conn.pipe(socket);
				socket.pipe(conn);
			})
		});

	conn.on('error', function(err) {
		filterSocketConnReset(err, 'PROXY_TO_SERVER_SOCKET');
	});
	socket.on('error', function(err) {
		filterSocketConnReset(err, 'CLIENT_TO_PROXY_SOCKET');
	});
});
*/

// Since node 0.9.9, ECONNRESET on sockets are no longer hidden
function filterSocketConnReset(err, socketDescription) {
	if (err.errno === 'ECONNRESET') {
		console.log('Got ECONNRESET on ' + socketDescription + ', ignoring.');
	} else {
		console.log('Got unexpected error on ' + socketDescription, err);
	}
}

proxy.onError(function(ctx, err) {
	console.error("ERROR:", err);
});

proxy.onRequest(function(ctx, callback) {
	console.log('REQUEST: http://' + ctx.clientToProxyRequest.headers.host + ctx.clientToProxyRequest.url);

	if (ctx.clientToProxyRequest.headers.host === "ctest.cdn.nintendo.net") {
		ctx.proxyToClientResponse.setHeader("X-Organization", "Nintendo");
		ctx.proxyToClientResponse.setHeader("Content-Type", "text/plain");
		ctx.proxyToClientResponse.statusCode = 200;
		ctx.proxyToClientResponse.end('ok');
	} else if (ctx.clientToProxyRequest.headers.host === "conntest.nintendowifi.net") {
		ctx.proxyToClientResponse.setHeader("X-Organization", "Nintendo");
		ctx.proxyToClientResponse.setHeader("Content-Type", "text/html");
		ctx.proxyToClientResponse.statusCode = 200;
		ctx.proxyToClientResponse.end('<!DOCTYPE html PUBLIC " - //W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><head><title>HTML Page</title></head><body bgcolor="#FFFFFF">This is test.html page</body></html>');
	} else {
		var chunks = [];
		ctx.onResponse(function(ctx, callback) {
			return callback(null);
		});

		ctx.onResponseData(function(ctx, chunk, callback) {
			chunks.push(chunk);
			//chunk = new Buffer(chunk.toString().replace(/<h3.*?<\/h3>/g, '<h3>Pwned!</h3>'));
			return callback(null, chunk);
		});

		ctx.onResponseEnd(function(ctx, callback) {
			console.log("REQUEST END", (Buffer.concat(chunks)).toString(), ctx.proxyToClientResponse);
			return callback(null);
		});

		return callback();
	}
});

proxy.onCertificateRequired = function(hostname, callback) {
	console.log("Keys needed I guess");
	return callback(null, {
		keyFile: path.join(__dirname, "switch.key"),
		certFile: path.join(__dirname, "switch.cert")
	});
};

proxy.listen({
	port: 8080
});

console.log("Started proxy server");
console.log("IP " + ip.address() + ":8080");