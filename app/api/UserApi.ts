import express, { NextFunction, Request, Response } from "express";
import { UserController } from "../../app/controllers/UserController";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import {
  LoginObject,
  LoginObjectSchema,
  User,
  UserSchema,
} from "../../app/types/User.type";
import { validateBodySchema, wrapControllerMiddleware } from "./ApiHelpers";

export const userApi = express.Router();
const controller = new UserController();
const buildKey = (
  req: Request<{ id: string }, any, User | LoginObject>,
  res: Response,
  next: NextFunction
) => {
  const paramsId = req.params.id; //sets id even in case of POST
  const bodyId = req.body.username;

  //Prevent changing ID
  const isTryingToChangeID = paramsId && bodyId && paramsId !== bodyId;
  if (isTryingToChangeID) throw errors.create(ErrorMessages.bad_request);

  //ID is required
  if (!paramsId && !bodyId)
    throw errors.create(ErrorMessages.required_fields_missing, "username");

  const id = paramsId || bodyId;
  req.params.id = UserController.buildKeyFunction(id); //TODO secondary effect should be avoided
  next();
};

userApi.post(
  "/register",
  buildKey,
  validateBodySchema(LoginObjectSchema),
  wrapControllerMiddleware(controller.register)
);

userApi.post(
  "/login",
  buildKey,
  validateBodySchema(LoginObjectSchema),
  wrapControllerMiddleware(controller.login)
);

userApi.get("/:id", buildKey, wrapControllerMiddleware(controller.get));
userApi.delete("/:id", buildKey, wrapControllerMiddleware(controller.delete));
userApi.patch(
  "/:id",
  buildKey,
  validateBodySchema(UserSchema.partial()),
  wrapControllerMiddleware(controller.patch)
);
userApi.put(
  "/:id",
  buildKey,
  validateBodySchema(UserSchema),
  wrapControllerMiddleware(controller.put)
);
userApi.post(
  "/",
  buildKey,
  validateBodySchema(UserSchema),
  wrapControllerMiddleware(controller.post)
);
