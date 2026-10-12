// Single source of truth for OVIA Client Services and Contact Information

export interface ClientServicesConfig {
  brandName: string;
  supportPhone: string;
  supportPhoneDisplay: string;
  supportEmail: string;
  whatsappUrl: string;
  appleMessagesUrl: string;
  facebookMessengerUrl: string;
  businessHours: {
    weekday: string;
    sunday: string;
    timezone: string;
  };
  locations: {
    name: string;
    address: string;
    city: string;
    phone: string;
  }[];
}

export const clientServicesConfig: ClientServicesConfig = {
  brandName: "OVIA",
  supportPhone: "+917410724158",
  supportPhoneDisplay: "+91 74107 24158",
  supportEmail: "adarshshukla4639@gmail.com",
  whatsappUrl: "https://wa.me/917410724158",
  appleMessagesUrl: "sms:+917410724158",
  facebookMessengerUrl: "https://m.me/ovia",
  businessHours: {
    weekday: "Monday – Saturday: 10:00 AM – 7:00 PM",
    sunday: "Sunday: 10:00 AM – 5:00 PM",
    timezone: "IST",
  },
  locations: [
    {
      name: "OVIA Maison Mumbai",
      address: "Jio World Plaza, Bandra Kurla Complex",
      city: "Mumbai, Maharashtra",
      phone: "+91 74107 24158",
    },
    {
      name: "OVIA New Delhi",
      address: "DLF Emporio, Vasant Kunj",
      city: "New Delhi, Delhi",
      phone: "+91 74107 24158",
    },
    {
      name: "OVIA Bengaluru",
      address: "The Collection, UB City",
      city: "Bengaluru, Karnataka",
      phone: "+91 74107 24158",
    },
  ],
};

/**
 * Dispatches an event to open the existing right-side Client Services drawer.
 */
export function openContactDrawer() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-contact-drawer"));
  }
}
