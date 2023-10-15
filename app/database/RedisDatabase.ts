import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import { ErrorMessages } from "../errors/Errors.type";
import { errors } from "../errors/errors";

export class RedisDatabase {
  private static instance: RedisDatabase;
  private static client: RedisClientType;

  constructor() {
    if (!RedisDatabase.instance) RedisDatabase.instance = this;
    if (!RedisDatabase.client) RedisDatabase.initClient();
    return RedisDatabase.instance;
  }

  private static initClient() {
    RedisDatabase.client = createClient({
      url: "redis://TFM:tfmPassword@localhost:6379",
    });
    RedisDatabase.client.on("error", (err) => {
      throw errors.create(ErrorMessages.redis_error);
    });
    RedisDatabase.client.on("connect", () => {
      console.log("Connected to redis successfully");
    });
  }

  private async checkConnection() {
    const maxRetries = 3;
    let currentRetries = 0;
    while (currentRetries < maxRetries) {
      if (RedisDatabase.client.isOpen) return;
      await RedisDatabase.client.connect();
      await new Promise((f) => setTimeout(f, 1000)); //delay for 1s
      currentRetries++;
    }
    throw errors.create(ErrorMessages.redis_connection_error);
  }

  async get<T>(key: string): Promise<T> {
    await this.checkConnection();

    const storedValue = await RedisDatabase.client.get(key);
    if (!storedValue) return undefined as T;

    return JSON.parse(storedValue) as T;
  }

  async set<T>(key: string, value: T): Promise<T> {
    await this.checkConnection();

    const result = await RedisDatabase.client.set(key, JSON.stringify(value));

    //on failure returns null
    if (!result) throw errors.create(ErrorMessages.not_inserted);

    return value;
  }

  async delete(key: string) {
    await this.checkConnection();

    return await RedisDatabase.client.del(key);
  }
}
