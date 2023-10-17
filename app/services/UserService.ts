import { RedisDatabase } from "../../app/database/RedisDatabase";
import { User } from "../../app/types/User.type";

export class UserService {
  private database = new RedisDatabase();

  private buildKey = (id: string) => `user-${id}`;

  public async get(id: string): Promise<User> {
    const transformedId = this.buildKey(id);
    return await this.database.get(transformedId);
  }

  public async update(id: string, user: User): Promise<User> {
    const transformedId = this.buildKey(id);
    return await this.database.set(transformedId, user);
  }

  public async create(user: User): Promise<User> {
    const transformedId = this.buildKey(user.username);
    return await this.database.set(transformedId, user);
  }

  /*
  async checkPermissions(id:string, perm: Permissions):Promise<boolean>{

  }
  */
}
