import { NotionTitleProp, NotionRelationProp } from "../../config/types"
import { joinPlainText } from "../../utils/joinPlainText"

type Properties = {
  ["Nome"]?: NotionTitleProp
  ["Tasks"]?: NotionRelationProp
}

export function mapRecordCustomer(properties: Properties) {
  const name =
    joinPlainText(properties?.["Nome"]?.title) ??
    ""
  const tasks = properties?.["Tasks"]?.relation?.map(r => r.id) ?? []

  return { name: name.toUpperCase(), tasks }
}
