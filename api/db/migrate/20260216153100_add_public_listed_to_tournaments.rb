class AddPublicListedToTournaments < ActiveRecord::Migration[8.1]
  def change
    add_column :tournaments, :public_listed, :boolean, null: false, default: true
    add_index :tournaments, :public_listed
  end
end
