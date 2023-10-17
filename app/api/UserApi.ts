import express from "express";
import { UserController } from "../../app/controllers/UserController";
import { LoginObjectSchema } from "../../app/types/User.type";
import { validateBodySchema, wrapControllerMiddleware } from "./ApiHelpers";

export const userApi = express.Router();
const controller = new UserController();

userApi.post(
  "/register",
  validateBodySchema(LoginObjectSchema),
  wrapControllerMiddleware(controller.register)
);

userApi.post(
  "/login",
  validateBodySchema(LoginObjectSchema),
  wrapControllerMiddleware(controller.login)
);
