class RestoreEmployeeDiscountFeatures < ActiveRecord::Migration[8.1]
  def change
    add_column :tournaments, :employee_discount_enabled, :boolean, null: false, default: false unless column_exists?(:tournaments, :employee_discount_enabled)
    add_column :tournaments, :employee_entry_fee, :integer, default: 5000 unless column_exists?(:tournaments, :employee_entry_fee)

    create_table :employee_numbers do |t|
      t.references :tournament, null: false, foreign_key: true
      t.string :employee_number, null: false
      t.string :employee_name
      t.boolean :used, null: false, default: false
      t.references :used_by_golfer, foreign_key: { to_table: :golfers }
      t.timestamps
    end unless table_exists?(:employee_numbers)

    add_index :employee_numbers, [:tournament_id, :employee_number], unique: true unless index_exists?(:employee_numbers, [:tournament_id, :employee_number], unique: true)

    add_column :golfers, :is_employee, :boolean, null: false, default: false unless column_exists?(:golfers, :is_employee)
    add_column :golfers, :employee_number, :string unless column_exists?(:golfers, :employee_number)
    add_reference :golfers, :employee_number_record, foreign_key: { to_table: :employee_numbers } unless column_exists?(:golfers, :employee_number_record_id)
  end
end
