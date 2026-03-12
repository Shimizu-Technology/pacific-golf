require "test_helper"

class TournamentBrandingOverridesTest < ActionDispatch::IntegrationTest
  def setup
    @admin = users(:user_one)
    @tournament = tournaments(:tournament_one)
    authenticate_as(@admin)
  end

  test "org admin can update tournament branding overrides" do
    patch "/api/v1/tournaments/#{@tournament.id}",
          params: {
            tournament: {
              use_org_branding: false,
              theme_preset: "event",
              primary_color_override: "#1f7a3a",
              accent_color_override: "#0f172a",
              logo_url_override: "https://example.com/logo.png",
              banner_url_override: "https://example.com/banner.png",
              signature_image_url_override: "https://example.com/signature.png"
            }
          },
          headers: auth_headers

    assert_response :success
    body = JSON.parse(response.body)

    assert_equal false, body["use_org_branding"]
    assert_equal "event", body["theme_preset"]
    assert_equal "#1f7a3a", body["primary_color_override"]
    assert_equal "#0f172a", body["accent_color_override"]
    assert_equal "https://example.com/logo.png", body["logo_url_override"]
    assert_equal "https://example.com/banner.png", body["banner_url_override"]
    assert_equal "https://example.com/signature.png", body["signature_image_url_override"]
    assert_equal "#1f7a3a", body["effective_primary_color"]
  end

  test "unknown legacy employee fee field does not crash update" do
    patch "/api/v1/tournaments/#{@tournament.id}",
          params: {
            tournament: {
              name: @tournament.name,
              employee_entry_fee: 5000,
              theme_preset: "classic"
            }
          },
          headers: auth_headers

    assert_response :success
  end
end
