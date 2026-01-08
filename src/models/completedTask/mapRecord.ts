import { NotionTitleProp, NotionSelectProp, NotionRichTextProp, NotionStatusProp, NotionDateProp, NotionPeopleProp, NotionRollupProp } from "../../config/types"
import { joinPlainText } from "../../utils/joinPlainText"

type Properties = {
  ["Nome"]?: NotionTitleProp
  ["Project"]?: NotionSelectProp
  ["DEVIS"]?: NotionRichTextProp
  ["State"]?: NotionStatusProp
  ["Notes"]?: NotionRichTextProp
  ["Concluído em"]?: NotionDateProp
  ["Assignee"]?: NotionSelectProp
  ["Pessoa"]?: NotionPeopleProp
  ["Team"]?: NotionSelectProp
  ["Month"]?: NotionSelectProp
  ["Year ID"]?: NotionRollupProp
}

export function mapRecordCompletedTask(properties: Properties) {
  const name =
    joinPlainText(properties?.["Nome"]?.title) ??
    ""
  const completion_dates = properties?.["Project"]?.select?.name ?? ""
  const devis = joinPlainText(properties?.["DEVIS"]?.rich_text) ?? ""
  const status = properties?.["State"]?.status?.name ?? ""
  const notes = joinPlainText(properties?.["Notes"]?.rich_text) ?? ""
  const completed_at = properties?.["Concluído em"]?.date?.start ?? ""
  const assignee = properties?.["Assignee"]?.select?.name ?? ""
  const people = properties?.["Pessoa"]?.people?.[0]?.name ?? undefined
  const team = properties?.["Team"]?.select?.name ?? ""
  const month = properties?.["Month"]?.select?.name ?? ""
  const year_id = properties?.["Year ID"]?.rollup?.array?.[0]?.number ?? undefined

  return { name: name.toUpperCase(), completion_dates, devis, status, notes, completed_at, assignee, people, team, month, year_id }
}
