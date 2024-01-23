import { MigrationInterface, QueryRunner } from "typeorm";

export class DropDeviceMsg1706012070059 implements MigrationInterface {
  name = "DropDeviceMsg1706012070059";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("message");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
