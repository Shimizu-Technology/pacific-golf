class CreateAccessRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :access_requests do |t|
      t.string :organization_name, null: false
      t.string :contact_name, null: false
      t.string :email, null: false
      t.string :phone
      t.text :notes
      t.string :status, null: false, default: "new"
      t.string :source, null: false, default: "homepage"
      t.datetime :reviewed_at
      t.bigint :reviewed_by_id

      t.timestamps
    end

    add_index :access_requests, :status
    add_index :access_requests, :email
    add_index :access_requests, :created_at
    add_index :access_requests, :reviewed_by_id
    add_foreign_key :access_requests, :users, column: :reviewed_by_id, on_delete: :nullify
  end
end
