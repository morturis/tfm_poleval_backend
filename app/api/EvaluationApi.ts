import express from "express";
import { EvaluationController } from "../../app/controllers/EvaluationController";
import {
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

evalApi.get(
  "/all",
  wrapControllerMiddleware(verifyUserPermissions()), //dont need any permission, just to be logged in
  wrapControllerMiddleware(controller.getAllByUser)
);
evalApi.get(
  "/:id/exists",
  wrapControllerMiddleware(verifyUserPermissions()), //don´t need any permission
  wrapControllerMiddleware(controller.checkExistence)
);
evalApi.get(
  "/:id",
  wrapControllerMiddleware(verifyUserPermissions(Permissions.EDIT_EVAL)),
  wrapControllerMiddleware(controller.get)
);
evalApi.patch(
  "/:id",
  wrapControllerMiddleware(verifyUserPermissions(Permissions.EDIT_EVAL)),
  validateBodySchema(EvaluationSchema), //Patch accepts partial body matching
  wrapControllerMiddleware(controller.patch)
);
evalApi.post(
  "/",
  wrapControllerMiddleware(verifyUserPermissions()),
  validateBodySchema(EvaluationSchema),
  wrapControllerMiddleware(controller.create) //the classic post method from the abstract controller does not update the user with the permissions
);

evalApi.get(
  "/:id/form",
  wrapControllerMiddleware(verifyUserPermissions(Permissions.FILL_FORM)),
  wrapControllerMiddleware(controller.getForm)
);
evalApi.post(
  "/:id/answer",
  wrapControllerMiddleware(verifyUserPermissions(Permissions.FILL_FORM)),
  validateBodySchema(EvaluationResponseSchema),
  wrapControllerMiddleware(controller.answer)
);
