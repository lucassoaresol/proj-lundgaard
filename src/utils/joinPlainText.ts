import { NotionText } from "../config/types";

export function joinPlainText(chunks?: NotionText[]) {
  if (!chunks?.length) return undefined;
  const contents = chunks
    .map((c) => c?.text?.content?.trim())
    .filter(Boolean) as string[];
  return contents.length ? contents.join(" ") : undefined;
}
