import express from "express";

import raidRouter from "./routers/raid.router";
import env from "./utils/env";

const app = express();

app.use("/raids", raidRouter);

const port = env.PORT ?? 8000;
app.listen(port);
console.log(`Listening on port ${port}`);
