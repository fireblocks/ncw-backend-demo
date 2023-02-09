import { MigrationInterface, QueryRunner } from "typeorm";

export class PhysicalDeviceId1686223351958 implements MigrationInterface {
  name = "PhysicalDeviceId1686223351958";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD \`physicalDeviceId\` varchar(64) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP COLUMN \`physicalDeviceId\``,
    );
  }
}
