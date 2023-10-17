import { RedisDatabase } from "../../app/database/RedisDatabase";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import { Evaluation } from "../../app/types/Evaluation.type";

export class EvaluationService {
  private database = new RedisDatabase();

  private buildKey = (id: string) => `eval-${id}`;

  async get(id: string): Promise<Evaluation> {
    const transformedId = this.buildKey(id);
    const evaluation = await this.database.get<Evaluation>(transformedId);
    return Promise.resolve(evaluation);
  }

  async update(id: string, evaluation: Evaluation): Promise<Evaluation> {
    const transformedId = this.buildKey(id);
    return await this.database.set<Evaluation>(transformedId, evaluation);
  }

  async create(evaluation: Evaluation): Promise<Evaluation> {
    const transformedId = this.buildKey(evaluation.code);
    const evaluationAlreadyExists = await this.get(transformedId);
    if (evaluationAlreadyExists)
      throw errors.create(ErrorMessages.already_exists);
    return await this.database.set<Evaluation>(transformedId, evaluation);
  }
}
