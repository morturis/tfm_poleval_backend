import { Request, Response } from "express";
import { merge } from "lodash";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import { EvaluationService } from "../../app/services/EvaluationService";
import { UserService } from "../../app/services/UserService";
import { Evaluation } from "../../app/types/Evaluation.type";
import { Permissions, User } from "../../app/types/User.type";

export class EvaluationController {
  private static userService = new UserService();
  private static evaluationService = new EvaluationService();

  async getForm(req: Request<{ id: string }, any, any>, res: Response) {
    const {
      params: { id },
    } = req;
    const evaluation = await EvaluationController.evaluationService.get(id);

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
    const evaluation = await EvaluationController.evaluationService.get(id);
    if (!evaluation) throw errors.create(ErrorMessages.not_found);

    evaluation.responses = [...(evaluation.responses || []), body];

    const result = await EvaluationController.evaluationService.update(
      id,
      evaluation
    );
    if (!result) throw errors.create(ErrorMessages.internal_server_error);

    res.status(201).send(body); //respond with the original answer
  }

  async getAllByUser(
    req: Request<Record<string, unknown>, any, any>,
    res: Response
  ) {
    let user = { ...(req.params?.user as User) };
    if (!user) throw errors.create(ErrorMessages.bad_request);

    user = await EvaluationController.userService.get(user.username);
    const result: Record<string, Record<string, unknown>> = {};
    for (const ev of user.evaluations) {
      const { eval_name, permissions } = ev;

      //In case we ever want to add a state or something similar
      const evaluation = await EvaluationController.evaluationService.get(
        eval_name
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
    const evaluation = await EvaluationController.evaluationService.get(id);

    if (evaluation) throw errors.create(ErrorMessages.already_exists);

    throw errors.create(ErrorMessages.not_found);
  }

  async create(
    req: Request<{ id: string; user: User }, any, Evaluation>,
    res: Response
  ) {
    const { body } = req;
    const {
      params: { user },
    } = req;
    const result = await EvaluationController.evaluationService.create(body);

    const alreadyExistingUser = await EvaluationController.userService.get(
      user.username
    );

    if (!alreadyExistingUser) throw errors.create(ErrorMessages.not_found);

    alreadyExistingUser.evaluations.push({
      eval_name: result.code,
      permissions: [Permissions.EDIT_EVAL, Permissions.FILL_FORM],
    });
    await EvaluationController.userService.update(
      user.username,
      alreadyExistingUser
    );

    res.status(200).send(result);
  }

  async get(req: Request<{ id: string }, any, Evaluation>, res: Response) {
    const {
      params: { id },
    } = req;
    const evaluation = await EvaluationController.evaluationService.get(id);

    if (!evaluation) throw errors.create(ErrorMessages.not_found);

    res.status(200).send(evaluation);
  }
  async patch(req: Request<{ id: string }, any, Evaluation>, res: Response) {
    const {
      params: { id },
      body,
    } = req;
    const currentlyExistingEvaluation =
      await EvaluationController.evaluationService.get(id);

    if (!currentlyExistingEvaluation)
      throw errors.create(ErrorMessages.not_found);

    const modifiedEvaluation = merge(currentlyExistingEvaluation, body);
    const response = await EvaluationController.evaluationService.update(
      id,
      modifiedEvaluation
    );
    res.status(200).send(response);
  }
}
