import { MigrationInterface, QueryRunner } from "typeorm";

export class MessageLastSeen1678365779118 implements MigrationInterface {
  name = "MessageLastSeen1678365779118";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`last_seen\` datetime NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP COLUMN \`last_seen\``,
    );
  }
}
