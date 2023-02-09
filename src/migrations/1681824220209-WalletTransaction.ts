import { MigrationInterface, QueryRunner } from "typeorm";

export class WalletTransaction1681824220209 implements MigrationInterface {
  name = "WalletTransaction1681824220209";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM \`transaction\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`wallets_txs\``);
    await queryRunner.query(
      `CREATE TABLE \`wallets_txs\` (\`walletId\` varchar(64) NOT NULL, \`txId\` varchar(255) NOT NULL, INDEX \`IDX_c1438e8a3508da56c1895fe3dd\` (\`walletId\`), INDEX \`IDX_9ce29e7a19c0ec883f1ca588f0\` (\`txId\`), PRIMARY KEY (\`walletId\`, \`txId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD \`lastUpdated\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP COLUMN \`status\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD \`status\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_63f749fc7f7178ae1ad85d3b95\` ON \`transaction\` (\`status\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_83cb622ce2d74c56db3e0c29f1\` ON \`transaction\` (\`createdAt\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_4da9d9ce7ed17b792136e4521c\` ON \`transaction\` (\`lastUpdated\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`wallets_txs\` ADD CONSTRAINT \`FK_c1438e8a3508da56c1895fe3ddd\` FOREIGN KEY (\`walletId\`) REFERENCES \`wallet\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`wallets_txs\` ADD CONSTRAINT \`FK_9ce29e7a19c0ec883f1ca588f09\` FOREIGN KEY (\`txId\`) REFERENCES \`transaction\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`wallets_txs\` DROP FOREIGN KEY \`FK_9ce29e7a19c0ec883f1ca588f09\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`wallets_txs\` DROP FOREIGN KEY \`FK_c1438e8a3508da56c1895fe3ddd\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_4da9d9ce7ed17b792136e4521c\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_83cb622ce2d74c56db3e0c29f1\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_63f749fc7f7178ae1ad85d3b95\` ON \`transaction\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP COLUMN \`status\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD \`status\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP COLUMN \`lastUpdated\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP COLUMN \`createdAt\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_9ce29e7a19c0ec883f1ca588f0\` ON \`wallets_txs\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_c1438e8a3508da56c1895fe3dd\` ON \`wallets_txs\``,
    );
    await queryRunner.query(`DROP TABLE \`wallets_txs\``);
  }
}
