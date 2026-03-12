require "test_helper"

class TournamentTest < ActiveSupport::TestCase
  test "requires organization" do
    tournament = Tournament.new(
      name: "Orphan Tournament",
      year: 2026,
      status: "draft"
    )

    assert_not tournament.valid?
    assert_includes tournament.errors[:organization], "must exist"
  end

  test "copy_for_next_year preserves organization" do
    original = tournaments(:tournament_one)
    copy = original.copy_for_next_year

    assert_equal original.organization_id, copy.organization_id
  end

  test "theme preset must be in approved list" do
    tournament = tournaments(:tournament_one)
    tournament.theme_preset = "wild_custom"

    assert_not tournament.valid?
    assert_includes tournament.errors[:theme_preset], "is not included in the list"
  end

  test "effective branding falls back to organization defaults" do
    tournament = tournaments(:tournament_one)
    tournament.update!(
      use_org_branding: true,
      primary_color_override: "#ff0000",
      logo_url_override: "https://example.com/tournament-logo.png"
    )

    assert_equal tournament.organization.primary_color, tournament.effective_primary_color
    assert_equal tournament.organization.logo_url, tournament.effective_logo_url
  end
end
