require "test_helper"

class AccessRequestsFlowTest < ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper

  setup do
    @super_admin = users(:super_admin)
    @org_admin = users(:user_one)
    clear_enqueued_jobs
  end

  teardown do
    clear_enqueued_jobs
  end

  test "public create stores request and enqueues notification email" do
    assert_difference("AccessRequest.count", 1) do
      assert_enqueued_emails 1 do
        post "/api/v1/access_requests", params: {
          access_request: {
            organization_name: "Make-A-Wish Guam",
            contact_name: "Dana Cruz",
            email: "dana@example.com",
            phone: "671-555-0188",
            notes: "Interested in a pilot for our annual charity event.",
            source: "homepage"
          }
        }
      end
    end

    assert_response :created
  end

  test "honeypot submission is accepted without creating a record" do
    assert_no_difference("AccessRequest.count") do
      post "/api/v1/access_requests", params: {
        access_request: {
          organization_name: "Spam Org",
          contact_name: "Bot",
          email: "bot@example.com",
          source: "homepage"
        },
        website: "http://bot.example"
      }
    end

    assert_response :accepted
  end

  test "super admin can list access requests" do
    authenticate_as(@super_admin)

    get "/api/v1/admin/access_requests", headers: auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    assert body.is_a?(Array)
    assert body.first.key?("organization_name")
  end

  test "org admin cannot list access requests" do
    authenticate_as(@org_admin)

    get "/api/v1/admin/access_requests", headers: auth_headers

    assert_response :forbidden
  end

  test "super admin can update request status" do
    authenticate_as(@super_admin)
    request = access_requests(:one)

    patch "/api/v1/admin/access_requests/#{request.id}",
          params: { access_request: { status: "contacted" } },
          headers: auth_headers

    assert_response :success
    request.reload
    assert_equal "contacted", request.status
    assert_not_nil request.reviewed_at
    assert_equal @super_admin.id, request.reviewed_by_id
  end
end
