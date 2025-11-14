import { CronJob } from "cron";

import { runShellScript } from "../utils/runShellScript";

CronJob.from({
  cronTime: "0 0 * * *",
  onTick: () => {
    const dirs = ["logs"];
    dirs.forEach((el) =>
      runShellScript(`find ${el} -type f -mtime +5 -exec rm {} \\;`),
    );
  },
  start: true,
});
