import { NotionPeopleProp, NotionRichTextProp, NotionRollupProp, NotionSelectProp, NotionStatusProp, NotionTitleProp } from "../../config/types"
import { joinPlainText } from "../../utils/joinPlainText"

type Properties = {
  ["Nome"]?: NotionTitleProp
  ["Project"]?: NotionSelectProp
  ["DEVIS"]?: NotionRichTextProp
  ["Status"]?: NotionStatusProp
  ["Notes"]?: NotionRichTextProp
  ["Assignee"]?: NotionSelectProp
  ["Pessoa"]?: NotionPeopleProp
  ["Team"]?: NotionSelectProp
  ["Cliente ID"]?: NotionRollupProp
}

export function mapRecordTask(properties: Properties) {
  const name =
    joinPlainText(properties?.["Nome"]?.title) ??
    ""
  const customer = properties?.["Project"]?.select?.name ?? ""
  const devis = joinPlainText(properties?.["DEVIS"]?.rich_text) ?? ""
  const status = properties?.["Status"]?.status?.name ?? ""
  const notes = joinPlainText(properties?.["Notes"]?.rich_text) ?? ""
  const assignee = properties?.["Assignee"]?.select?.name ?? ""
  const people = properties?.["Pessoa"]?.people?.[0]?.name ?? undefined
  const team = properties?.["Team"]?.select?.name ?? ""
  const customer_id = properties?.["Cliente ID"]?.rollup?.array?.[0]?.number ?? undefined

  return { name: name.toUpperCase(), customer, devis, status, notes, assignee, people, team, customer_id }
}
