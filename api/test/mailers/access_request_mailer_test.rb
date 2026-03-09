require "test_helper"

class AccessRequestMailerTest < ActionMailer::TestCase
  test "notify_new_request sends request details" do
    access_request = access_requests(:one)

    original_notify_email = ENV["ACCESS_REQUEST_NOTIFY_EMAIL"]
    ENV["ACCESS_REQUEST_NOTIFY_EMAIL"] = "notify@example.com"

    mail = AccessRequestMailer.notify_new_request(access_request)

    assert_equal ["notify@example.com"], mail.to
    assert_equal "New Pacific Golf access request: #{access_request.organization_name}", mail.subject
    assert_match access_request.contact_name, mail.body.encoded
    assert_match access_request.email, mail.body.encoded
  ensure
    ENV["ACCESS_REQUEST_NOTIFY_EMAIL"] = original_notify_email
  end
end
