import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateOrderTables1757709059447 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'orders',
            columns: [
                { name: 'id', type: 'uuid', isPrimary: true },
                { name: 'user_id', type: 'varchar', length: '255', isNullable: false },
                { name: 'total_amount', type: 'numeric', precision: 10, scale: 2, isNullable: false },
                { name: 'currency', type: 'varchar', length: '3', isNullable: false },
                { name: 'status', type: 'varchar', length: '50', isNullable: false },
                { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
                { name: 'updated_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
                { name: 'shipping_address_id', type: 'uuid', isNullable: true },
                { name: 'billing_address_id', type: 'uuid', isNullable: true },
                { name: 'payment_id', type: 'varchar', length: '255', isNullable: true },
                { name: 'metadata', type: 'jsonb', isNullable: true },
            ],
        }));

        await queryRunner.createTable(new Table({
            name: 'order_items',
            columns: [
                { name: 'id', type: 'serial', isPrimary: true },
                { name: 'order_id', type: 'uuid', isNullable: false },
                { name: 'sku_id', type: 'varchar', length: '255', isNullable: false },
                { name: 'quantity', type: 'int', isNullable: false },
                { name: 'unit_price', type: 'numeric', precision: 10, scale: 2, isNullable: false },
                { name: 'total_price', type: 'numeric', precision: 10, scale: 2, isNullable: false },
                { name: 'attributes', type: 'jsonb', isNullable: true },
            ],
        }));

        await queryRunner.createForeignKey('order_items', new TableForeignKey({
            columnNames: ['order_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'orders',
            onDelete: 'CASCADE',
        }));

        await queryRunner.createTable(new Table({
            name: 'order_history',
            columns: [
                { name: 'id', type: 'serial', isPrimary: true },
                { name: 'order_id', type: 'uuid', isNullable: false },
                { name: 'previous_status', type: 'varchar', length: '50', isNullable: true },
                { name: 'new_status', type: 'varchar', length: '50', isNullable: false },
                { name: 'changed_by', type: 'varchar', length: '255', isNullable: true },
                { name: 'changed_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
                { name: 'reason', type: 'text', isNullable: true },
            ],
        }));

        await queryRunner.createForeignKey('order_history', new TableForeignKey({
            columnNames: ['order_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'orders',
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('order_history');
        await queryRunner.dropTable('order_items');
        await queryRunner.dropTable('orders');
    }
}