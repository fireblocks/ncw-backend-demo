import { MigrationInterface, QueryRunner } from "typeorm";

export class LongText1679307012348 implements MigrationInterface {
  name = "LongText1679307012348";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`message\` DROP COLUMN \`message\``);
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`message\` longtext NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`message\` DROP COLUMN \`message\``);
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`message\` varchar(255) NOT NULL`,
    );
  }
}
