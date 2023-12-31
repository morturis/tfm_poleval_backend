export type CustomError = {
  code: number;
  message: ErrorMessages;
  extraInfo?: string;
};

export enum ErrorMessages {
  default_error = "default_error",
  method_not_implemented = "method_not_implemented",
  redis_error = "redis_error",
  redis_connection_error = "redis_connection_error",
  not_found = "not_found",
  not_inserted = "not_inserted",
  bad_request = "bad_request",
  required_fields_missing = "required_fields_missing",
  already_exists = "already_exists",
  unauthorized = "unauthorized",
  internal_server_error = "internal_server_error",
  token_expired = "token_expired",
  not_published = "not_published",
}
