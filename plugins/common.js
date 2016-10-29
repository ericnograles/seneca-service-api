function handleError(statusCode, originalPayload, message, done) {
  done(null, {
    statusCode: statusCode,
    original: originalPayload,
    error: {
      message: message
    }
  });
}

module.exports = {
  handleError: handleError
};