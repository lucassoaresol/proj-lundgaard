import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  port: z
    .string()
    .default("3000")
    .transform((val) => parseInt(val, 10)),
  envType: z.enum(["linux", "windows"]).default("linux"),
  authNotion: z.string(),
});

export const env = schema.parse({
  port: process.env.PORT,
  envType: process.env.ENV_TYPE,
  authNotion: process.env.AUTH_NOTION,
});
