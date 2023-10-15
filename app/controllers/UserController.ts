import { Request, Response } from "express";
import { encodeToken } from "../../app/api/ApiHelpers";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import { LoginObject, User } from "../../app/types/User.type";
import { Controller } from "./AbstractController";

const defaultPermissions: Pick<User, "evaluations"> = {
  evaluations: [],
};

export class UserController extends Controller<User> {
  static buildKeyFunction = (id: string): string => {
    return `user-${id}`;
  };

  async register(
    req: Request<{ id: string }, any, LoginObject>,
    res: Response
  ) {
    const {
      params: { id }, //generated id
      body, //login object
    } = req;

    //check if generated id already exists
    const userAlreadyExists = await Controller.database.get<User>(id);
    if (userAlreadyExists) throw errors.create(ErrorMessages.already_exists);

    //insert into database
    const newUser = { ...body, ...defaultPermissions };
    const result = await Controller.database.set(id, newUser);

    const token = await encodeToken(result);

    res.status(201).send({ username: result.username, token });
  }

  async login(req: Request<{ id: string }, any, LoginObject>, res: Response) {
    const {
      params: { id }, //generated id
      body, //login object
    } = req;

    const registeredUser = await Controller.database.get<User>(id);
    if (!registeredUser) throw errors.create(ErrorMessages.not_found);

    const passwordsMatch = body.password === registeredUser.password;
    if (!passwordsMatch) throw errors.create(ErrorMessages.unauthorized);

    const token = await encodeToken(registeredUser);

    res.status(200).send({ username: registeredUser.username, token });
  }

  async getCurrentFormOfUser(user: User) {
    return await Controller.database.get<User>(
      UserController.buildKeyFunction(user.username)
    );
  }
}
