import { z } from "zod";
import type {
  AccountProfile,
  AccountProfileInput,
} from "@/lib/account-profile";
import type { User } from "@/lib/types";
import { transaction } from "./db";
import { ApiError } from "./http";

const name = z
  .string()
  .trim()
  .max(80, "Names must be 80 characters or fewer.")
  .refine(
    (value) => !value || /^[\p{L}\p{M}\s.'’\-]+$/u.test(value),
    "Names may contain letters, spaces, apostrophes, hyphens and periods.",
  )
  .refine((value) => !/[\r\n\t]/.test(value), "Enter a name on one line.");

export const accountProfileSchema = z
  .object({
    title: z.enum(["", "Mr", "Ms", "Mx", "Dr"]),
    contactEmail: z.union([z.email().max(254), z.literal("")]).optional(),
    firstName: name.refine(
      (value) => /\p{L}/u.test(value),
      "Enter your first name.",
    ),
    lastName: name,
    displayName: name
      .refine((value) => value.length > 0, "Enter a display name.")
      .optional(),
    phoneType: z.enum(["mobile", "home"]),
    phoneCountryCode: z.enum(["+91", "+1", "+44", "+971", "+65"]),
    phone: z
      .string()
      .trim()
      .max(15, "Enter a phone number of 15 digits or fewer.")
      .refine(
        (value) => !value || /^\d{6,15}$/.test(value),
        "Enter a phone number using 6 to 15 digits, without spaces.",
      ),
    country: z.enum(["IN", "US", "GB", "AE", "SG"]),
    dateOfBirth: z
      .string()
      .max(10)
      .refine((value) => {
        if (!value) return true;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(`${value}T00:00:00.000Z`);
        return (
          Number.isFinite(date.getTime()) &&
          date.toISOString().slice(0, 10) === value &&
          value >= "1900-01-01" &&
          value <= new Date().toISOString().slice(0, 10)
        );
      }, "Enter a valid date of birth in the past, or leave it blank."),
    preferences: z
      .object({
        email: z.boolean(),
        phone: z.boolean(),
        textMessage: z.boolean(),
        postal: z.boolean(),
      })
      .strict(),
  })
  .strict()
  .refine(
    (input) =>
      !input.phone ||
      input.phoneCountryCode.length - 1 + input.phone.length <= 15,
    {
      message:
        "The country code and phone number must contain at most 15 digits.",
      path: ["phone"],
    },
  );

export type StoredAccountProfile = AccountProfileInput & {
  updatedAt: string;
  preferencesConsent: {
    version: 1;
    updatedAt: string;
    preferences: AccountProfileInput["preferences"];
  };
};
type ProfileUser = User & { accountProfile?: StoredAccountProfile };

export function safeAccountProfile(
  user: Pick<User, "name" | "email"> & {
    accountProfile?: StoredAccountProfile;
  },
): AccountProfile {
  const [firstName = "", ...rest] = user.name.trim().split(/\s+/u);
  const fallback: AccountProfileInput = {
    title: "",
    firstName,
    lastName: rest.join(" "),
    phoneType: "mobile",
    phoneCountryCode: "+91",
    phone: "",
    country: "IN",
    dateOfBirth: "",
    preferences: {
      email: false,
      phone: false,
      textMessage: false,
      postal: false,
    },
  };
  if (!user.accountProfile) return { ...fallback, email: user.email };
  const {
    title,
    firstName: storedFirstName,
    lastName,
    displayName,
    contactEmail,
    phoneType,
    phoneCountryCode,
    phone,
    country,
    dateOfBirth,
    preferences,
  } = user.accountProfile;
  const parsed = accountProfileSchema.safeParse({
    title,
    firstName: storedFirstName,
    lastName,
    displayName,
    contactEmail,
    phoneType,
    phoneCountryCode,
    phone,
    country,
    dateOfBirth,
    preferences,
  });
  return { ...(parsed.success ? parsed.data : fallback), email: user.email };
}

export async function readAccountProfile(userId: string) {
  return transaction(async (repo) => {
    const user = await repo.get<ProfileUser>("users", userId);
    if (!user?.verifiedAt) throw new ApiError(401, "Please sign in.");
    return safeAccountProfile(user);
  });
}

export async function saveAccountProfile(userId: string, raw: unknown) {
  const input = accountProfileSchema.parse(raw);
  return transaction(async (repo) => {
    const user = await repo.get<ProfileUser>("users", userId);
    if (!user?.verifiedAt) throw new ApiError(401, "Please sign in.");
    const previous = user.accountProfile;
    const changed =
      !previous?.preferencesConsent ||
      Object.entries(input.preferences).some(
        ([channel, selected]) =>
          previous.preferences?.[channel as keyof typeof input.preferences] !==
          selected,
      );
    const now = new Date().toISOString();
    const accountProfile: StoredAccountProfile = {
      ...input,
      updatedAt: now,
      preferencesConsent: changed
        ? {
            version: 1,
            updatedAt: now,
            preferences: { ...input.preferences },
          }
        : previous!.preferencesConsent,
    };
    const updated: ProfileUser = {
      ...user,
      name:
        input.displayName ||
        [input.firstName, input.lastName].filter(Boolean).join(" "),
      accountProfile,
    };
    await repo.put("users", updated);
    return safeAccountProfile(updated);
  });
}
