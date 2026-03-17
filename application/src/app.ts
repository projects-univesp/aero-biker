import express from "express";
import { appRouter } from "@routes/index";
import { env } from "@utils/env";

const app = express();
app.use(express.json());
app.use(appRouter);

app.listen(env.PORT, () => {
  console.log(`Server is running at http://localhost:${env.PORT}`);
});
