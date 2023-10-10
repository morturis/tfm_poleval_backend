import express, { NextFunction, Request, Response } from "express";
import { EvaluationController } from "../../app/controllers/EvaluationController";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import {
  Evaluation,
  EvaluationResponseSchema,
  EvaluationSchema,
} from "../../app/types/Evaluation.type";
import { Permissions } from "../../app/types/User.type";
import {
  validateBodySchema,
  verifyUserPermissions,
  wrapControllerMiddleware,
} from "./ApiHelpers";

export const evalApi = express.Router();
const controller = new EvaluationController();
const buildKey = (
  req: Request<{ id: string }, any, Evaluation>,
  res: Response,
  next: NextFunction
) => {
  const paramsId = req.params.id; //sets id even in case of POST
  const bodyId = req.body.code;

  //Prevent changing ID
  const isTryingToChangeID = paramsId && bodyId && paramsId !== bodyId;
  if (isTryingToChangeID)
    throw errors.create(ErrorMessages.bad_request, "Wrong code in body");

  //ID is required
  if (!paramsId && !bodyId)
    throw errors.create(ErrorMessages.required_fields_missing, "code");

  const id = paramsId || bodyId;
  req.params.id = `eval-${id}`; //TODO secondary effect should be avoided
  next();
};

evalApi.get(
  "/:id",
  wrapControllerMiddleware(verifyUserPermissions(Permissions.EDIT_EVAL)),
  buildKey,
  wrapControllerMiddleware(controller.get)
);
evalApi.delete(
  "/:id",
  wrapControllerMiddleware(verifyUserPermissions(Permissions.EDIT_EVAL)),
  buildKey,
  wrapControllerMiddleware(controller.delete)
);
evalApi.patch(
  "/:id",
  wrapControllerMiddleware(verifyUserPermissions(Permissions.EDIT_EVAL)),
  buildKey,
  validateBodySchema(EvaluationSchema.partial()), //Patch accepts partial body matching
  wrapControllerMiddleware(controller.patch)
);
evalApi.put(
  "/:id",
  wrapControllerMiddleware(verifyUserPermissions(Permissions.EDIT_EVAL)),
  buildKey,
  validateBodySchema(EvaluationSchema),
  wrapControllerMiddleware(controller.put)
);
evalApi.post(
  "/",
  wrapControllerMiddleware(verifyUserPermissions(Permissions.EDIT_EVAL)),
  buildKey,
  validateBodySchema(EvaluationSchema),
  wrapControllerMiddleware(controller.post)
);

evalApi.get(
  "/:id/form",
  wrapControllerMiddleware(verifyUserPermissions(Permissions.FILL_FORM)),
  buildKey,
  wrapControllerMiddleware(controller.form)
);
evalApi.post(
  "/:id/answer",
  wrapControllerMiddleware(verifyUserPermissions(Permissions.FILL_FORM)),
  buildKey,
  validateBodySchema(EvaluationResponseSchema),
  wrapControllerMiddleware(controller.answer)
);
