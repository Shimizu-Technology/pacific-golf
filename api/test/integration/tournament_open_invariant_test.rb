require "test_helper"

class TournamentOpenInvariantTest < ActionDispatch::IntegrationTest
  def setup
    @org = organizations(:org_one)
    @admin = users(:user_one)
    authenticate_as(@admin)
  end

  test "opening a tournament closes other open tournaments in same org" do
    currently_open = Tournament.create!(
      organization: @org,
      name: "Current Open Tournament",
      year: 2026,
      status: "open",
      registration_open: true
    )

    target = Tournament.create!(
      organization: @org,
      name: "Target Tournament",
      year: 2026,
      status: "draft",
      registration_open: false
    )

    other_org = Organization.create!(
      name: "Other Organization",
      slug: "other-org-#{SecureRandom.hex(4)}",
      subscription_status: "active"
    )
    other_org_open = Tournament.create!(
      organization: other_org,
      name: "Other Org Open Tournament",
      year: 2026,
      status: "open",
      registration_open: true
    )

    post "/api/v1/tournaments/#{target.id}/open", headers: auth_headers
    assert_response :success

    assert_equal "open", target.reload.status
    assert_equal true, target.registration_open

    assert_equal "closed", currently_open.reload.status
    assert_equal false, currently_open.registration_open

    assert_equal "open", other_org_open.reload.status
    assert_equal true, other_org_open.registration_open
  end
end
