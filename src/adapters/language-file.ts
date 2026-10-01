import * as FileSystem from "expo-file-system/legacy";
import { isLanguageId, type LanguageId } from "../packages/player-session";

const FILE = `${FileSystem.documentDirectory ?? ""}language.txt`;

export async function readStoredLanguage(): Promise<LanguageId | null> {
  if (!FileSystem.documentDirectory) return null;
  try {
    const stored = (await FileSystem.readAsStringAsync(FILE)).trim();
    return isLanguageId(stored) ? stored : null;
  } catch {
    return null;
  }
}

export async function writeStoredLanguage(id: LanguageId): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  await FileSystem.writeAsStringAsync(FILE, id);
}
