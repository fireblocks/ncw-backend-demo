import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1676564237412 implements MigrationInterface {
  name = "Init1676564237412";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`message\` (\`id\` int NOT NULL AUTO_INCREMENT, \`deviceId\` varchar(64) NOT NULL, \`message\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`sub\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_3641ff83ff7c23b2760b3df56d\` (\`sub\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`wallet\` (\`id\` varchar(64) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`device\` (\`id\` varchar(64) NOT NULL, \`userId\` int NOT NULL, \`walletId\` varchar(64) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_d39ce1e9b866435541a5dab8093\` FOREIGN KEY (\`deviceId\`) REFERENCES \`device\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`device\` ADD CONSTRAINT \`FK_69536b80ca522ea82d054ebe1b0\` FOREIGN KEY (\`walletId\`) REFERENCES \`wallet\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`device\` ADD CONSTRAINT \`FK_9eb58b0b777dbc2864820228ebc\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`device\` DROP FOREIGN KEY \`FK_9eb58b0b777dbc2864820228ebc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`device\` DROP FOREIGN KEY \`FK_69536b80ca522ea82d054ebe1b0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_d39ce1e9b866435541a5dab8093\``,
    );
    await queryRunner.query(`DROP TABLE \`device\``);
    await queryRunner.query(`DROP TABLE \`wallet\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_3641ff83ff7c23b2760b3df56d\` ON \`user\``,
    );
    await queryRunner.query(`DROP TABLE \`user\``);
    await queryRunner.query(`DROP TABLE \`message\``);
  }
}
