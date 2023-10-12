import { Request, Response } from "express";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import { Evaluation } from "../../app/types/Evaluation.type";
import { User } from "../../app/types/User.type";
import { Controller } from "./AbstractController";

export class EvaluationController extends Controller<Evaluation> {
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
    const user = req.params?.user as User; //TODO this is a naive check
    if (!user) throw errors.create(ErrorMessages.bad_request);

    const result: Record<string, Record<string, unknown>> = {};
    for (const ev of user.evaluations) {
      const { eval_name, permissions } = ev;

      //In case we ever want to add a state or something similar
      const evaluation = await Controller.database.get<Evaluation>(
        `eval-${eval_name}`
      );

      permissions.forEach(
        (perm) =>
          (result[perm] = {
            ...(result[perm] || {}),
            [`${Object.keys(result[perm] || {}).length}`]: {
              eval_name: eval_name,
              intervention_name: evaluation.intervention.name,
            },
          })
      );
    }
    res.status(200).send(result);
  }
}
