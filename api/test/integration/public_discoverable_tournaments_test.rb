require "test_helper"

class PublicDiscoverableTournamentsTest < ActionDispatch::IntegrationTest
  test "returns only public listed open tournaments with registration open" do
    public_tournament = tournaments(:tournament_one)

    hidden_tournament = Tournament.create!(
      organization: organizations(:org_one),
      name: "Private Invite",
      year: 2026,
      status: "open",
      registration_open: true,
      public_listed: false
    )

    closed_tournament = Tournament.create!(
      organization: organizations(:org_one),
      name: "Closed Registration",
      year: 2026,
      status: "open",
      registration_open: false,
      public_listed: true
    )

    get "/api/v1/tournaments/discoverable"

    assert_response :success
    data = JSON.parse(response.body)
    ids = data.map { |row| row["id"] }

    assert_includes ids, public_tournament.id
    refute_includes ids, hidden_tournament.id
    refute_includes ids, closed_tournament.id
  end

  test "supports query filter" do
    get "/api/v1/tournaments/discoverable", params: { q: "Test Tournament" }

    assert_response :success
    data = JSON.parse(response.body)
    assert_equal 1, data.length
    assert_equal "Test Tournament", data.first["name"]
  end
end
