export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_SPECIAL_CHARACTERS = "!@#$%^&*?+-/,.";

// Shared by the account forms and server; never trim or transform passwords.
export function getPasswordChecks(password: string) {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      met: password.length >= PASSWORD_MIN_LENGTH,
      message: "Password must contain at least 8 characters.",
    },
    {
      id: "spaces",
      label: "No spaces",
      met: password.length > 0 && !/\s/u.test(password),
      message: "Password must not contain spaces or whitespace.",
    },
    {
      id: "digit",
      label: "Includes a digit",
      met: /[0-9]/.test(password),
      message: "Password must include at least one digit.",
    },
    {
      id: "uppercase",
      label: "Includes an uppercase letter",
      met: /[A-Z]/.test(password),
      message: "Password must include at least one uppercase letter.",
    },
    {
      id: "special",
      label: "Includes a special character: " + PASSWORD_SPECIAL_CHARACTERS,
      met: [...PASSWORD_SPECIAL_CHARACTERS].some((character) =>
        password.includes(character),
      ),
      message:
        "Password must include at least one special character from " +
        PASSWORD_SPECIAL_CHARACTERS,
    },
  ];
}

export function getPasswordValidationError(
  password: string,
): string | undefined {
  if (password.length > PASSWORD_MAX_LENGTH)
    return "Password must contain no more than 128 characters.";
  return getPasswordChecks(password).find((check) => !check.met)?.message;
}
