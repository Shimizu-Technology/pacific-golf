require "test_helper"

class EmployeeNumbersFlowTest < ActionDispatch::IntegrationTest
  def setup
    @admin = users(:user_one)
    @tournament = tournaments(:tournament_one)
    authenticate_as(@admin)
    @tournament.update!(employee_discount_enabled: true, employee_entry_fee: 5000)
  end

  test "org admin can create and validate employee number" do
    post "/api/v1/employee_numbers",
         params: {
           tournament_id: @tournament.id,
           employee_number: {
             employee_number: "EMP-2001",
             employee_name: "Airport Ops"
           }
         },
         headers: auth_headers
    assert_response :created

    post "/api/v1/employee_numbers/validate",
         params: {
           tournament_id: @tournament.id,
           employee_number: "EMP-2001"
         }
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal true, body["valid"]
    assert_equal 5000, body["employee_fee"]
  end
end
