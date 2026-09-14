import { observeWorker } from "./observeWorker";
import { createYearWorker, excludeYearWorker, updateYearWorker } from "./services/year";

observeWorker(createYearWorker, "create-year");
observeWorker(updateYearWorker, "update-year");
observeWorker(excludeYearWorker, "exclude-year");
