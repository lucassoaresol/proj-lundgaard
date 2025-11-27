import { NotionTitleProp, NotionRelationProp, NotionText } from "../../config/types"

type Properties = {
  ["Nome"]?: NotionTitleProp
  ["Tasks"]?: NotionRelationProp
}

function joinPlainText(chunks?: NotionText[]) {
  if (!chunks?.length) return undefined
  const contents = chunks
    .map(c => c?.text?.content?.trim())
    .filter(Boolean) as string[]
  return contents.length ? contents.join(" ") : undefined
}

export function mapRecordCustomer(properties: Properties) {
  const name =
    joinPlainText(properties?.["Nome"]?.title) ??
    ""
  const tasks = properties?.["Tasks"]?.relation?.map(r => r.id) ?? []

  return { name: name.toUpperCase(), tasks }
}
