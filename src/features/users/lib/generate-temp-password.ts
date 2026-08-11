/** Client-safe temporary password that satisfies passwordStrengthSchema. */
export function generateTempPassword(length = 14): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;

  const picks = [
    upper[Math.floor(Math.random() * upper.length)]!,
    lower[Math.floor(Math.random() * lower.length)]!,
    digits[Math.floor(Math.random() * digits.length)]!,
    special[Math.floor(Math.random() * special.length)]!,
  ];

  const remaining = Math.max(length - picks.length, 0);
  for (let i = 0; i < remaining; i += 1) {
    picks.push(all[Math.floor(Math.random() * all.length)]!);
  }

  for (let i = picks.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = picks[i]!;
    picks[i] = picks[j]!;
    picks[j] = tmp;
  }

  return picks.join("");
}
