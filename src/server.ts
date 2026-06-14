import "dotenv/config"
import express from "express";

const app = express();
const PORT = process.env.PORT || 3005;

app.get("/", (req, res) => {
  res.status(200).json({ message: "Health check: success" });
});

app.listen(PORT, (data) => {
  console.log(`Server is running on port ${PORT}`);
  console.log("Data: ", data);
});
