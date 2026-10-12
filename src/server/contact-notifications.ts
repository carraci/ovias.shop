import { ticketReference } from "./support-conversations";
import type { Repository } from "./db";
import { transaction } from "./db";
import { sendAccountEmail } from "./mail";
import { clientServicesConfig } from "@/lib/client-services-config";

type ContactNotice = {
  id: string;
  name: string;
  email: string;
  message: string;
  subject?: string;
  ticketId?: string;
};
type NotificationMail = {
  id: string;
  to: string;
  subject: string;
  text: string;
  status: "pending" | "sent";
  createdAt: string;
};
export async function queueContactNotification(
  repo: Repository,
  contact: ContactNotice,
) {
  const id = `contact-notification-${contact.id}`;
  if (await repo.get("outbox", id)) return id;
  const reference = ticketReference(
    contact.ticketId || "contact:" + contact.id,
  );
  await repo.put<NotificationMail>("outbox", {
    id,
    to: clientServicesConfig.supportEmail,
    subject: `OVIA customer message: ${(contact.subject || contact.name).replace(/[\r\n]/g, " ").slice(0, 180)}`,
    text: `Customer: ${contact.name}\nCustomer email: ${contact.email}\nReference: ${reference}\n\n${contact.message}\n\nOpen request: ${process.env.APP_ORIGIN || "http://localhost:3000"}/admin/support?ticket=${encodeURIComponent(contact.ticketId || "contact:" + contact.id)}

This message is also saved in your OVIA Support inbox.`,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  return id;
}
export async function attemptContactNotification(
  id: string,
  deps?: {
    run: <T>(fn: (repo: Repository) => Promise<T>) => Promise<T>;
    send: typeof sendAccountEmail;
  },
) {
  const run = deps?.run || transaction;
  const send = deps?.send || sendAccountEmail;
  try {
    const mail = await run((repo) => repo.get<NotificationMail>("outbox", id));
    if (!mail) return "Queued" as const;
    if (mail.status === "sent") return "Sent" as const;
    await send(mail);
    await run(async (repo) => {
      const current = await repo.get<NotificationMail>("outbox", id);
      if (current)
        await repo.put("outbox", {
          ...current,
          text: "[delivered]",
          status: "sent",
        });
    });
    return "Sent" as const;
  } catch {
    // The durable outbox retains this email for the existing delivery worker.
    return "Queued" as const;
  }
}
