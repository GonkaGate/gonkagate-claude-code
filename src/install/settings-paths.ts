import { homedir } from "node:os";
import path from "node:path";
import type { InstallScope, SettingsTarget } from "../types/settings.js";

export function getSettingsTarget(scope: InstallScope, cwd: string, userHome = homedir()): SettingsTarget {
  if (scope === "user") {
    return {
      scope,
      path: path.join(userHome, ".claude", "settings.json")
    };
  }

  return {
    scope,
    path: path.join(cwd, ".claude", "settings.local.json")
  };
}
