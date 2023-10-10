import express from "express";
import { evalApi } from "./app/api/EvaluationApi";
import { userApi } from "./app/api/UserApi";
import { errors } from "./app/errors/errors";

const app = express();
const port = 3000;

app.use(express.json());
app.use("/evaluation", evalApi);
app.use("/user", userApi);

//Must be last
app.use(errors.errorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
