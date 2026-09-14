import { observeWorker } from "./observeWorker";
import { createCustomerWorker, excludeCustomerWorker, updateCustomerWorker } from "./services/customer";

observeWorker(createCustomerWorker, "create-customer");
observeWorker(updateCustomerWorker, "update-customer");
observeWorker(excludeCustomerWorker, "exclude-customer");
