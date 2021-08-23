const createProxyMiddleware = require("http-proxy-middleware");
const conf = require("./settings");

module.exports = function (app) {
  app.use(
    "/job",
    createProxyMiddleware({
      target: conf.jenkins.url,
      changeOrigin: true,
    })
  );
};
