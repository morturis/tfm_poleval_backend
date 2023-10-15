import { Request, Response } from "express";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import { Evaluation } from "../../app/types/Evaluation.type";
import { Permissions, User } from "../../app/types/User.type";
import { Controller } from "./AbstractController";
import { UserController } from "./UserController";

export class EvaluationController extends Controller<Evaluation> {
  static userController = new UserController();

  static buildKeyFunction = (id: string): string => {
    return `eval-${id}`;
  };

  async form(req: Request<{ id: string }, any, any>, res: Response) {
    const {
      params: { id },
    } = req;
    const evaluation = await Controller.database.get<Evaluation>(id);

    if (!evaluation) throw errors.create(ErrorMessages.not_found);

    res.status(200).send(evaluation.form || {});
  }

  async answer(
    req: Request<{ id: string }, any, Record<string, string>>,
    res: Response
  ) {
    const {
      params: { id },
      body,
    } = req;
    const evaluation = await Controller.database.get<Evaluation>(id);
    if (!evaluation) throw errors.create(ErrorMessages.not_found);

    evaluation.responses = [...(evaluation.responses || []), body];

    const result = await Controller.database.set(id, evaluation);

    res.status(201).send(body);
  }

  async getAllByUser(
    req: Request<Record<string, unknown>, any, any>,
    res: Response
  ) {
    let user = req.params?.user as User; //TODO this is a naive check
    if (!user) throw errors.create(ErrorMessages.bad_request);

    user = await EvaluationController.userController.getCurrentFormOfUser(user);
    const result: Record<string, Record<string, unknown>> = {};
    for (const ev of user.evaluations) {
      const { eval_name, permissions } = ev;

      //In case we ever want to add a state or something similar
      const evaluation = await Controller.database.get<Evaluation>(
        EvaluationController.buildKeyFunction(eval_name)
      );
      if (!evaluation) continue;

      permissions.forEach(
        (perm) =>
          (result[perm] = {
            ...(result[perm] || {}),
            [`${Object.keys(result[perm] || {}).length}`]: {
              code: eval_name,
              intervention_name: evaluation?.intervention?.name || "-",
            },
          })
      );
    }
    res.status(200).send(result);
  }

  async checkExistence(
    req: Request<{ id: string }, any, Evaluation>,
    res: Response
  ) {
    const {
      params: { id },
    } = req;
    const obj = await Controller.database.get<Evaluation>(id);

    if (obj) throw errors.create(ErrorMessages.already_exists);

    throw errors.create(ErrorMessages.not_found);
  }

  async create(
    req: Request<{ id: string; user: User }, any, Evaluation>,
    res: Response
  ) {
    const { body } = req;
    const {
      params: { id, user },
    } = req;
    const result = await Controller.database.set(id, body);
    user.evaluations.push({
      eval_name: result.code,
      permissions: [Permissions.EDIT_EVAL, Permissions.FILL_FORM],
    });

    const userId = UserController.buildKeyFunction(user.username);
    const alreadyExistingUser = await Controller.database.get<User>(userId);

    if (!alreadyExistingUser) throw errors.create(ErrorMessages.not_found);

    const modifiedObj = {
      ...alreadyExistingUser,
      ...user,
    };
    await Controller.database.set(userId, modifiedObj);

    res.status(200).send(result);
  }
}
