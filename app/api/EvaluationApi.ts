import express, { NextFunction, Request, Response } from "express";
import { Controller } from "../../app/controllers/AbstractController";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import { Evaluation, EvaluationSchema } from "../../app/types/Evaluation.type";
import { validateBodySchema, wrapControllerMiddleware } from "./ApiHelpers";

export const evalApi = express.Router();
const controller = new Controller<Evaluation>();
const buildKey = (
  req: Request<{ id: string }, any, Evaluation>,
  res: Response,
  next: NextFunction
) => {
  const paramsId = req.params.id; //sets id even in case of POST
  const bodyId = req.body.code;

  //Prevent changing ID
  const isTryingToChangeID = paramsId && bodyId && paramsId !== bodyId;
  if (isTryingToChangeID) throw errors.create(ErrorMessages.bad_request);

  //ID is required
  if (!paramsId && !bodyId)
    throw errors.create(ErrorMessages.required_fields_missing, "code");

  const id = paramsId || bodyId;
  if (!paramsId) req.params.id = `eval-${id}`; //TODO secondary effect should be avoided
  next();
};

evalApi.get("/:id", buildKey, wrapControllerMiddleware(controller.get));
evalApi.delete("/:id", buildKey, wrapControllerMiddleware(controller.delete));
evalApi.patch(
  "/:id",
  buildKey,
  validateBodySchema(EvaluationSchema.partial()), //Patch accepts partial body matching
  wrapControllerMiddleware(controller.patch)
);
evalApi.put(
  "/:id",
  buildKey,
  validateBodySchema(EvaluationSchema),
  wrapControllerMiddleware(controller.put)
);
evalApi.post(
  "/",
  buildKey,
  validateBodySchema(EvaluationSchema),
  wrapControllerMiddleware(controller.post)
);
