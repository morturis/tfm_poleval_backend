import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import { LoginObject, User } from "../../app/types/User.type";
import { Controller } from "./AbstractController";

const defaultPermissions: Pick<User, "evaluations"> = {
  evaluations: [],
};

export class UserController extends Controller<User> {
  async register(
    req: Request<{ id: string }, any, LoginObject>,
    res: Response
  ) {
    const {
      params: { id }, //generated id
      body, //login object
    } = req;

    //check if generated id already exists
    const userAlreadyExists = !!(await Controller.database.get(id));
    if (userAlreadyExists)
      throw errors.create(ErrorMessages.user_already_exists);

    //insert into database
    const newUser = { ...body, ...defaultPermissions };
    const result = await Controller.database.set(id, newUser);

    const token = jwt.sign();

    res.status(201).send(result);
  }
}
