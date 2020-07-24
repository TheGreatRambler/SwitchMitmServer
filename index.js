var Proxy = require("http-mitm-proxy");
var proxy = Proxy();

proxy.onError(function(ctx, err) {
	console.error("proxy error:", err);
});

proxy.onRequest(function(ctx, callback) {
	console.log("Request: ", ctx.clientToProxyRequest.headers);

	var chunks = [];
	ctx.onResponse(function(ctx, callback) {
		if (ctx.clientToProxyRequest.headers.host === "ctest.cdn.nintendo.net") {
			console.log("Set header for internet test");
			//ctx.proxyToClientResponse.header["Content-Type"] = "text/plain";
			ctx.proxyToClientResponse.setHeader("X-Organization", "Nintendo");
		}
		return callback();
	});

	ctx.onResponseData(function(ctx, chunk, callback) {
		chunks.push(chunk);
		//chunk = new Buffer(chunk.toString().replace(/<h3.*?<\/h3>/g, '<h3>Pwned!</h3>'));
		return callback(null, chunk);
	});

	ctx.onResponseEnd(function(ctx, callback) {
		console.log("REQUEST END", (Buffer.concat(chunks)).toString(), ctx.proxyToClientResponse);
		return callback();
	});

	return callback();
});

proxy.onCertificateRequired = function(hostname, callback) {
	console.log("Keys needed I guess");
	// Oh no
	/*return callback(null, {
	  keyFile: path.resolve('/ca/certs/', hostname + '.key'),
	  certFile: path.resolve('/ca/certs/', hostname + '.crt')
	});
	*/
};

proxy.listen({
	port: 7654
});