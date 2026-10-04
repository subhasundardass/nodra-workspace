export class AuthenticationError extends Error {
  readonly code: string = "AUTHENTICATION_ERROR";

  constructor(message = "Authentication failed") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  readonly code: string = "INVALID_CREDENTIALS";

  constructor() {
    super("Invalid username or password");
    this.name = "InvalidCredentialsError";
  }
}

export class UnauthorizedError extends AuthenticationError {
  readonly code: string = "UNAUTHORIZED";

  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
