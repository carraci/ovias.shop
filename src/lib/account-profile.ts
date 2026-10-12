export type ProfilePreferences = {
  email: boolean;
  phone: boolean;
  textMessage: boolean;
  postal: boolean;
};

export type AccountProfileInput = {
  title: "" | "Mr" | "Ms" | "Mx" | "Dr";
  firstName: string;
  lastName: string;
  displayName?: string;
  contactEmail?: string;
  phoneType: "mobile" | "home";
  phoneCountryCode: "+91" | "+1" | "+44" | "+971" | "+65";
  phone: string;
  country: "IN" | "US" | "GB" | "AE" | "SG";
  dateOfBirth: string;
  preferences: ProfilePreferences;
};

export type AccountProfile = AccountProfileInput & { email: string };
