import { Request, Response } from "express";
import { encodeToken } from "../../app/api/ApiHelpers";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import { UserService } from "../../app/services/UserService";
import { LoginObject, User } from "../../app/types/User.type";

const defaultPermissions: Pick<User, "evaluations"> = {
  evaluations: [],
};

export class UserController {
  private static userService = new UserService();

  async register(
    req: Request<{ id: string }, any, LoginObject>,
    res: Response
  ) {
    const {
      body, //login object
    } = req;

    //insert into database
    const userAlreadyExists = await UserController.userService.get(
      body.username
    );
    if (userAlreadyExists) throw errors.create(ErrorMessages.already_exists);
    const newUser = { ...body, ...defaultPermissions };
    const result = await UserController.userService.create(newUser);

    const token = await encodeToken(result);

    res.status(201).send({ username: result.username, token });
  }

  async login(req: Request<{ id: string }, any, LoginObject>, res: Response) {
    const {
      body, //login object
    } = req;

    const registeredUser = await UserController.userService.get(body.username);
    if (!registeredUser) throw errors.create(ErrorMessages.not_found);

    const passwordsMatch = body.password === registeredUser.password;
    if (!passwordsMatch) throw errors.create(ErrorMessages.unauthorized);

    const token = await encodeToken(registeredUser);

    res.status(200).send({ username: registeredUser.username, token });
  }
}
