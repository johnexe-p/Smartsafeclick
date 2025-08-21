import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/score", (req, res) => {
  const { url } = req.query;
  // TODO: call AI/heuristics; for now, trivial demo
  const risky = /login|verify|free|urgent/i.test(url || "");
  const risk = risky ? 80 : 10;
  const reason = risky ? "Suspicious keywords in URL" : "No obvious risk";
  res.json({ url, risk, reason });
});

app.listen(4000, () => console.log("Backend running on http://localhost:4000"));
