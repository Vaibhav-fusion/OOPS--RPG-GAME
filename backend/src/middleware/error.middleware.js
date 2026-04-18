export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === "ValidationError") {
    return res
      .status(400)
      .json({ message: "Validation error.", details: err.errors });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format." });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate key error." });
  }

  res.status(500).json({ message: "Internal server error." });
};
