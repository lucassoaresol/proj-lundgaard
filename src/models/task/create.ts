import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { retrieveCustomer } from "../customer/retrieve";
import { mapRecordTask } from "./mapRecord";

export async function createTask(notion_id: string) {
  const database = await databaseNotionPromise

  const taskExistin = await database.findFirst({ table: "tasks", where: { notion_id }, select: { "id": true } })

  if (!taskExistin) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;

    const data = mapRecordTask(result.properties);

    const customer = await retrieveCustomer(data.customer, data.customer_id);

    const newTask = await database.insertIntoTable<{ id: number }>({
      table: "tasks",
      dataDict: { data, customer_id: customer?.id, notion_id },
      select: { id: true },
    });

    if (newTask) {
      let propertiesData = {}
      let dataDict = {}

      propertiesData = { "Editable": { checkbox: true } }

      if (customer) {
        propertiesData = {
          ...propertiesData, "Cliente": { relation: [{ id: customer.notion_id }] }
        };
        dataDict = { ...dataDict, customer_id: customer.id };
      }

      if (!data.customer && customer) {
        propertiesData = {
          ...propertiesData, "Project": { select: { name: customer.name } }
        }
      }

      if (data.assignee.length < 2 && data.people) {
        propertiesData = {
          ...propertiesData, "Assignee": { select: { name: data.people } }
        }
      }

      const updateTask = (await notion.pages.update({
        page_id: notion_id,
        properties: { ID: { number: newTask.id }, ...propertiesData },
      })) as any;

      if (Object.keys(propertiesData).length) {
        const dataUpdate = mapRecordTask(updateTask.properties);
        dataDict = { ...dataDict, data: dataUpdate }
      }

      await database.updateIntoTable({
        table: "tasks",
        dataDict: {
          updated_at: dayLib(updateTask.last_edited_time).toDate(), ...dataDict
        },
        where: { id: newTask.id },
      });
    }
  }
}
