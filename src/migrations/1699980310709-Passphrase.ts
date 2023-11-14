import { MigrationInterface, QueryRunner } from "typeorm";

export class Passphrase1699980310709 implements MigrationInterface {
  name = "Passphrase1699980310709";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`passphrase\` (\`id\` varchar(255) NOT NULL, \`userId\` int NOT NULL, \`location\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`passphrase\` ADD CONSTRAINT \`FK_759a693ed2fa634697b4e2f4cc7\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`passphrase\` DROP FOREIGN KEY \`FK_759a693ed2fa634697b4e2f4cc7\``,
    );
    await queryRunner.query(`DROP TABLE \`passphrase\``);
  }
}
