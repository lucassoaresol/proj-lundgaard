import { NotionTitleProp, NotionRelationProp } from "../../config/types";
import { joinPlainText } from "../../utils/joinPlainText";

type Properties = {
  ["Nome"]?: NotionTitleProp;
  ["Tasks"]?: NotionRelationProp;
  ["ID"]?: { number?: number };
};

export function mapRecordCustomer(properties: Properties) {
  const name = joinPlainText(properties?.["Nome"]?.title) ?? "";
  const tasks = properties?.["Tasks"]?.relation?.map((r) => r.id) ?? [];
  const id = properties?.["ID"]?.number;
  const numericId =
    typeof id === "number" && Number.isInteger(id) && id > 0 ? id : undefined;

  return {
    name: name.toUpperCase(),
    tasks,
    ...(numericId !== undefined ? { id: numericId } : {}),
  };
}
