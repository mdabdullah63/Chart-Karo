function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || "Something went wrong";

  if (err.name === "CastError") {
    status = 400;
    message = "Invalid id";
  } else if (err.name === "ValidationError") {
    status = 400;
  }

  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === "production") message = "Something went wrong";
  }

  res.status(status).json({ success: false, message });
}

module.exports = { notFoundHandler, errorHandler };
