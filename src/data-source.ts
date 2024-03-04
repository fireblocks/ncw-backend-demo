import { DataSource } from "typeorm";
import opts from "./data-source-opts";

export const appDataSource = new DataSource(opts);
