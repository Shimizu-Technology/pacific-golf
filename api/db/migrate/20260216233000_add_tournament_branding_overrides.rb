class AddTournamentBrandingOverrides < ActiveRecord::Migration[8.0]
  def change
    add_column :tournaments, :use_org_branding, :boolean, null: false, default: true
    add_column :tournaments, :theme_preset, :string, null: false, default: "classic"
    add_column :tournaments, :primary_color_override, :string
    add_column :tournaments, :accent_color_override, :string
    add_column :tournaments, :logo_url_override, :string
    add_column :tournaments, :banner_url_override, :string
    add_column :tournaments, :signature_image_url_override, :string
  end
end
