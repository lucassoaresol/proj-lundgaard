import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  port: z
    .string()
    .default("3000")
    .transform((val) => parseInt(val, 10)),
  envType: z.enum(["linux", "windows"]).default("linux"),
  authNotion: z.string(),
  dataSourceCustomer: z.uuid(),
  templateCustomer: z.uuid(),
  dataSourceTask: z.uuid(),
  dataSourceYear: z.uuid(),
  templateYear: z.uuid(),
});

export const env = schema.parse({
  port: process.env.PORT,
  envType: process.env.ENV_TYPE,
  authNotion: process.env.AUTH_NOTION,
  dataSourceCustomer: process.env.DATA_SOURCE_CUSTOMER,
  templateCustomer: process.env.TEMPLATE_CUSTOMER,
  dataSourceTask: process.env.DATA_SOURCE_TASK,
  dataSourceYear: process.env.DATA_SOURCE_YEAR,
  templateYear: process.env.TEMPLATE_YEAR,
});
