import { MigrationInterface, QueryRunner } from "typeorm";

export class Transaction1681388691044 implements MigrationInterface {
  name = "Transaction1681388691044";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`transaction\` (\`id\` varchar(255) NOT NULL, \`status\` text NOT NULL, \`details\` json NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`transaction\``);
  }
}
