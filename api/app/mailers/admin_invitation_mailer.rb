class AdminInvitationMailer < ApplicationMailer
  def organization_admin_invite(user:, organization:, invited_by:)
    @user = user
    @organization = organization
    @invited_by = invited_by
    frontend_url = ENV.fetch("FRONTEND_URL", "http://localhost:5173").chomp("/")
    @admin_login_url = "#{frontend_url}/admin/login"

    mail(
      to: @user.email,
      subject: "You're invited to manage #{@organization.name} on Pacific Golf"
    )
  end
end
