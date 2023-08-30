import { MigrationInterface, QueryRunner } from "typeorm";

export class DeviceDate1693398986054 implements MigrationInterface {
  name = "DeviceDate1693398986054";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`device\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`device\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`device\` DROP COLUMN \`updatedAt\``);
    await queryRunner.query(`ALTER TABLE \`device\` DROP COLUMN \`createdAt\``);
  }
}
