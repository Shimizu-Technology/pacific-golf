require "test_helper"

class AccessRequestTest < ActiveSupport::TestCase
  test "is valid with required fields" do
    request = AccessRequest.new(
      organization_name: "Guam Chamber",
      contact_name: "Jordan Cruz",
      email: "Jordan@Example.com",
      source: "homepage"
    )

    assert request.valid?
    assert_equal "jordan@example.com", request.email
  end

  test "requires valid status" do
    request = AccessRequest.new(
      organization_name: "Guam Chamber",
      contact_name: "Jordan Cruz",
      email: "jordan@example.com",
      source: "homepage",
      status: "invalid"
    )

    assert_not request.valid?
    assert_includes request.errors[:status], "is not included in the list"
  end
end
