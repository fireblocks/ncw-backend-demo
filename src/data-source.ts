import { DataSource } from "typeorm";
import opts from "./data-source-opts";

export const AppDataSource = new DataSource(opts);
