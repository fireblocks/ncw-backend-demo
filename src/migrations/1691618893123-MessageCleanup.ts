import { MigrationInterface, QueryRunner } from "typeorm";

export class MessageCleanup1691618893123 implements MigrationInterface {
  name = "MessageCleanup1691618893123";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`TRUNCATE TABLE \`message\``);
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_d39ce1e9b866435541a5dab809\` ON \`message\` (\`deviceId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_58181a9d6e6905a52d366f8e9f\` ON \`message\` (\`last_seen\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_19d7362db248a3df27fc29b507\` ON \`message\` (\`createdAt\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_19d7362db248a3df27fc29b507\` ON \`message\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_58181a9d6e6905a52d366f8e9f\` ON \`message\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_d39ce1e9b866435541a5dab809\` ON \`message\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP COLUMN \`updatedAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP COLUMN \`createdAt\``,
    );
  }
}
