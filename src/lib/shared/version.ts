import packageJson from "../../../package.json";

import { RELEASES, type ReleaseNote } from "@/content/releases";

export const APP_VERSION = packageJson.version;

export function formatVersionLabel(version = APP_VERSION): string {
  return `v${version}`;
}

export function formatReleaseDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");

  if (!year || !month || !day) {
    return isoDate;
  }

  return `${day}.${month}.${year.slice(-2)}`;
}

/** Date label for What's New: clock time when `releasedAt` is set, else calendar date. */
export function formatReleaseDisplayDate(release: ReleaseNote): string {
  if (release.releasedAt) {
    const parsed = new Date(release.releasedAt);
    if (!Number.isNaN(parsed.getTime())) {
      const datePart = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Manila",
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      }).format(parsed);
      const timePart = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(parsed);
      return `${datePart.replace(/\//g, ".")} · ${timePart}`;
    }
  }

  return formatReleaseDate(release.date);
}

export function getVersionWithDateLabel(): string {
  const release = getCurrentRelease();
  const versionLabel = formatVersionLabel();

  if (!release?.date) {
    return versionLabel;
  }

  return `${versionLabel} · ${formatReleaseDate(release.date)}`;
}

/** Calendar date (DD.MM.YY) for the current package version’s release entry. */
export function getCurrentReleaseDateLabel(): string | undefined {
  const release = getCurrentRelease();
  if (!release?.date) {
    return undefined;
  }

  return formatReleaseDate(release.date);
}

export function getReleaseForVersion(version: string): ReleaseNote | undefined {
  return RELEASES.find((release) => release.version === version);
}

export function getCurrentRelease(): ReleaseNote | undefined {
  return getReleaseForVersion(APP_VERSION) ?? RELEASES[0];
}

export function getAllReleases(): ReleaseNote[] {
  return RELEASES;
}
