"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  getPasswordValidationError,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "@/lib/password-policy";
export function PasswordField({
  label = "Password",
  name = "password",
  strength = false,
  placeholder,
  iconToggle = false,
}: {
  label?: string;
  name?: string;
  strength?: boolean;
  placeholder?: string;
  iconToggle?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");
  return (
    <div className="password-field">
      <label htmlFor={name}>
        {label}
        {iconToggle && <span aria-hidden="true"> *</span>}
      </label>
      <div>
        <input
          id={name}
          name={name}
          placeholder={placeholder}
          type={show ? "text" : "password"}
          required
          minLength={strength ? PASSWORD_MIN_LENGTH : undefined}
          maxLength={PASSWORD_MAX_LENGTH}
          aria-describedby={strength ? name + "-requirements" : undefined}
          autoComplete={strength ? "new-password" : "current-password"}
          value={value}
          onChange={(e) => {
            const nextValue = e.target.value;
            setValue(nextValue);
            e.target.setCustomValidity(
              strength ? getPasswordValidationError(nextValue) || "" : "",
            );
          }}
        />
        <button
          type="button"
          aria-label={`${show ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={show}
          onClick={() => setShow(!show)}
        >
          {iconToggle ? (
            show ? (
              <EyeOff size={17} aria-hidden="true" />
            ) : (
              <Eye size={17} aria-hidden="true" />
            )
          ) : show ? (
            "Hide"
          ) : (
            "Show"
          )}
        </button>
      </div>
      {strength && (
        <p
          id={name + "-requirements"}
          className="small-note"
          aria-live="polite"
        >
          {getPasswordValidationError(value) ||
            "Password meets all requirements."}
        </p>
      )}
    </div>
  );
}
