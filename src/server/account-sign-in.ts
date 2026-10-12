import { cartOwner, signIn } from "./auth";
import { transaction } from "./db";
import type { Cart, User } from "@/lib/types";
export async function completeSignIn(user: User, guestCartId?: string) {
  const guest = guestCartId || (await cartOwner());
  await transaction(async (repo) => {
    const old = await repo.get<Cart>("carts", guest);
    if (!old?.lines.length || guest === user.id) return;
    const account = (await repo.get<Cart>("carts", user.id)) || {
      id: user.id,
      lines: [],
      version: 0,
    };
    for (const line of old.lines) {
      const present = account.lines.find((l) => l.sku === line.sku);
      if (present)
        present.quantity = Math.min(10, present.quantity + line.quantity);
      else account.lines.push(line);
    }
    await repo.put("carts", { ...account, version: account.version + 1 });
    await repo.remove("carts", guest);
  });
  await signIn(user);
}
