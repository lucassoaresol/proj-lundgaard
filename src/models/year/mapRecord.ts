import { NotionTitleProp } from "../../config/types"
import { joinPlainText } from "../../utils/joinPlainText"

type Properties = {
  ["Year"]?: NotionTitleProp
}

export function mapRecordYear(properties: Properties) {
  const year =
    joinPlainText(properties?.["Year"]?.title) ??
    ""

  return { year: year.toUpperCase() }
}
