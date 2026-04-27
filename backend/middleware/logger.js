function logger(req, res, next) {
  const startTime = Date.now();

  console.log(`[request] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    console.log(
      `[response] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}

module.exports = logger;
