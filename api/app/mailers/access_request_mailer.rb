# frozen_string_literal: true

class AccessRequestMailer < ApplicationMailer
  def notify_new_request(access_request)
    @access_request = access_request
    notify_to = ENV.fetch("ACCESS_REQUEST_NOTIFY_EMAIL", "shimizutechnology@gmail.com")

    mail(
      to: notify_to,
      subject: "New Pacific Golf access request: #{access_request.organization_name}"
    )
  end
end
