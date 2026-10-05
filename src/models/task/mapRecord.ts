import {
  NotionCheckboxProp,
  NotionDateProp,
  NotionPeopleProp,
  NotionRichTextProp,
  NotionRollupProp,
  NotionSelectProp,
  NotionRelationProp,
  NotionStatusProp,
  NotionTitleProp,
} from "../../config/types";
import { joinPlainText } from "../../utils/joinPlainText";

type Properties = {
  ["Nome"]?: NotionTitleProp;
  ["Project"]?: NotionSelectProp;
  ["Cliente"]?: NotionRelationProp;
  ["DEVIS"]?: NotionRichTextProp;
  ["Status"]?: NotionStatusProp;
  ["Notes"]?: NotionRichTextProp;
  ["Concluído em"]?: NotionDateProp;
  ["Assignee"]?: NotionSelectProp;
  ["Pessoa"]?: NotionPeopleProp;
  ["Team"]?: NotionSelectProp;
  ["Cliente ID"]?: NotionRollupProp;
  ["Editable"]?: NotionCheckboxProp;
};

export function mapRecordTask(properties: Properties) {
  const name = joinPlainText(properties?.["Nome"]?.title) ?? "";
  const projectValues = properties?.["Project"]?.select?.name
    ? [properties["Project"]!.select!.name]
    : (properties?.["Project"]?.multi_select?.map((value) => value.name) ?? []);
  const customer = projectValues.length === 1 ? projectValues[0] : "";
  const devis = joinPlainText(properties?.["DEVIS"]?.rich_text) ?? "";
  const status = properties?.["Status"]?.status?.name ?? "";
  const notes = joinPlainText(properties?.["Notes"]?.rich_text) ?? "";
  const completed_at = properties?.["Concluído em"]?.date?.start ?? "";
  const assignee = properties?.["Assignee"]?.select?.name ?? "";
  const people = properties?.["Pessoa"]?.people?.[0]?.name ?? undefined;
  const team = properties?.["Team"]?.select?.name ?? "";
  const customer_id =
    properties?.["Cliente ID"]?.rollup?.array?.[0]?.number ?? undefined;
  const is_editable = properties?.["Editable"]?.checkbox ?? false;
  const customer_notion_id = properties?.["Cliente"]?.relation?.[0]?.id;

  return {
    name: name.toUpperCase(),
    customer,
    devis,
    status,
    notes,
    completed_at,
    assignee,
    people,
    team,
    customer_id,
    customer_notion_id,
    is_editable,
  };
}
