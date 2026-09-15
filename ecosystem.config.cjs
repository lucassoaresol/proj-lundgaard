"use strict";

const runtimeRoot = "/root/lundgaard/prod/current";
const logRoot = "/var/log/lundgaard";

const common = {
  cwd: runtimeRoot,
  script: `${runtimeRoot}/ops/pm2-launch.sh`,
  interpreter: "none",
  exec_mode: "fork",
  instances: 1,
  autorestart: true,
  watch: false,
  min_uptime: "10s",
  max_restarts: 10,
  restart_delay: 2000,
  kill_timeout: 10000,
  merge_logs: true,
  log_type: "json",
  log_date_format: "YYYY-MM-DD HH:mm Z",
  env: {},
};

module.exports = {
  apps: [
    {
      ...common,
      name: "lundgaard-api",
      args: ["api"],
      out_file: `${logRoot}/api-out.log`,
      error_file: `${logRoot}/api-error.log`,
    },
    {
      ...common,
      name: "lundgaard-worker",
      args: ["worker"],
      out_file: `${logRoot}/worker-out.log`,
      error_file: `${logRoot}/worker-error.log`,
    },
    {
      ...common,
      name: "lundgaard-cron",
      args: ["cron"],
      out_file: `${logRoot}/cron-out.log`,
      error_file: `${logRoot}/cron-error.log`,
    },
  ],
};
