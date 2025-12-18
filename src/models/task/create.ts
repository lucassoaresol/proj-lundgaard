import { env } from "../../config/env";
import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { mapRecordCustomer } from "../customer/mapRecord";
import { mapRecordTask } from "./mapRecord";

export async function createTask(notion_id: string) {
  const database = await databaseNotionPromise

  const taskExistin = await database.findFirst({ table: "tasks", where: { notion_id }, select: { "id": true } })

  if (!taskExistin) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;

    const data = mapRecordTask(result.properties);
    const { customer_id } = data;

    const newTask = await database.insertIntoTable<{ id: number }>({
      table: "tasks",
      dataDict: { data, customer_id, notion_id },
      select: { id: true },
    });

    if (newTask) {
      let propertiesData = {}
      let dataDict = {}

      if (!customer_id && data.customer.length > 2) {
        const customer = await database.findFirst<{ id: number, notion_id: string }>({ table: "customers", where: { name: data.customer }, select: { id: true, notion_id: true } })
        if (customer) {
          propertiesData = {
            ...propertiesData, "Cliente": { relation: [{ id: customer.notion_id }] }
          }
          dataDict = { ...dataDict, customer_id: customer.id }
        } else {
          const newCustomerNotion = (await notion.pages.create({ parent: { data_source_id: env.dataSourceCustomer }, properties: { "Nome": { title: [{ text: { content: data.customer } }] } }, template: { type: "template_id", template_id: env.templateCustomer } })) as any

          const dataCustomer = mapRecordCustomer(newCustomerNotion.properties);

          const newCustomer = await database.insertIntoTable<{ id: number }>({
            table: "customers",
            dataDict: { name: dataCustomer.name, data: dataCustomer, notion_id: newCustomerNotion.id },
            select: { id: true },
          });

          if (newCustomer) {
            const updateCustomer = (await notion.pages.update({
              page_id: newCustomerNotion.id,
              properties: { ID: { number: newCustomer.id } },
            })) as any;

            await database.updateIntoTable({
              table: "customers",
              dataDict: {
                updated_at: dayLib(updateCustomer.last_edited_time).toDate(),
              },
              where: { id: newCustomer.id },
            });

            propertiesData = {
              ...propertiesData, "Cliente": { relation: [{ id: newCustomerNotion.id }] }
            }
            dataDict = { ...dataDict, customer_id: newCustomer.id }
          }
        }
      }

      if (!data.customer && customer_id) {
        const customer = await database.findFirst<{ name: string }>({ table: "customers", where: { id: customer_id }, select: { name: true } })
        if (customer) {
          propertiesData = {
            ...propertiesData, "Project": { select: { name: customer.name } }
          }
        }
      }

      if (data.assignee.length < 2 && data.people) {
        propertiesData = {
          ...propertiesData, "Assignee": { select: { name: data.people } }
        }
      }

      const updateNotionTag = (await notion.pages.update({
        page_id: notion_id,
        properties: { ID: { number: newTask.id }, ...propertiesData },
      })) as any;

      if (Object.keys(propertiesData).length) {
        const dataUpdate = mapRecordTask(updateNotionTag.properties);
        dataDict = { ...dataDict, data: dataUpdate }
      }

      await database.updateIntoTable({
        table: "tasks",
        dataDict: {
          updated_at: dayLib(updateNotionTag.last_edited_time).toDate(), ...dataDict
        },
        where: { id: newTask.id },
      });
    }
  }
}
