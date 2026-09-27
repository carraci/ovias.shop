"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
          minLength={10}
          maxLength={128}
          autoComplete={strength ? "new-password" : "current-password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
        <p className="small-note" aria-live="polite">
          {value.length < 10
            ? "Use at least 10 characters."
            : value.length < 15
              ? "Good length. A longer unique passphrase is stronger."
              : "Strong length. Use a unique passphrase."}
        </p>
      )}
    </div>
  );
}
