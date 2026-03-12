require "test_helper"

class AdminInvitesFlowTest < ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper

  setup do
    clear_enqueued_jobs
  end

  test "super admin can create organization with optional admin invites" do
    authenticate_as(users(:super_admin))

    assert_difference("Organization.count", 1) do
      assert_difference("User.count", 1) do
        assert_difference("OrganizationMembership.count", 1) do
          assert_enqueued_jobs 1 do
            post "/api/v1/admin/organizations",
                 params: {
                   organization: {
                     name: "Invite Test Org",
                     slug: "invite-test-org",
                     primary_color: "#16a34a",
                     admin_invite_emails: ["new-org-admin@example.com"]
                   }
                 },
                 headers: auth_headers
          end
        end
      end
    end

    assert_response :created

    body = JSON.parse(response.body)
    assert_equal 1, body["invited_admins"].length
    assert_equal "new-org-admin@example.com", body["invited_admins"].first["email"]
  end

  test "org admin can invite a new member who has not signed up yet" do
    authenticate_as(users(:user_one))

    assert_difference("User.count", 1) do
      assert_difference("OrganizationMembership.count", 1) do
        assert_enqueued_jobs 1 do
          post "/api/v1/admin/organizations/#{organizations(:org_one).slug}/members",
               params: {
                 email: "new-member@example.com",
                 role: "admin"
               },
               headers: auth_headers
        end
      end
    end

    assert_response :created

    body = JSON.parse(response.body)
    assert_equal true, body["invitation_sent"]
    assert_equal true, body["signup_required"]
    assert_equal false, body.dig("member", "signed_in")
  end

  test "org admin can resend invite for existing member" do
    authenticate_as(users(:user_one))

    post "/api/v1/admin/organizations/#{organizations(:org_one).slug}/members",
         params: {
           email: "resend-target@example.com",
           role: "admin"
         },
         headers: auth_headers
    assert_response :created
    member_id = JSON.parse(response.body).dig("member", "id")

    assert_enqueued_jobs 1 do
      post "/api/v1/admin/organizations/#{organizations(:org_one).slug}/members/#{member_id}/resend_invite",
           headers: auth_headers
    end

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal true, body["invitation_sent"]
    assert_equal false, body["signed_in"]
  end
end
