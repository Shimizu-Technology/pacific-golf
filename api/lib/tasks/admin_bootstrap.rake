# frozen_string_literal: true

namespace :admin do
  desc "Bootstrap or update super admin from BOOTSTRAP_SUPER_ADMIN_* env vars"
  task bootstrap_super_admin: :environment do
    email = ENV["BOOTSTRAP_SUPER_ADMIN_EMAIL"]&.strip&.downcase
    name = ENV["BOOTSTRAP_SUPER_ADMIN_NAME"]&.strip
    clerk_id = ENV["BOOTSTRAP_SUPER_ADMIN_CLERK_ID"]&.strip

    if email.blank?
      abort "Missing BOOTSTRAP_SUPER_ADMIN_EMAIL"
    end

    user = User.find_or_initialize_by(email: email)
    user.name = name if name.present?
    user.role = "super_admin"
    user.clerk_id = clerk_id if clerk_id.present?
    user.save!

    puts "Super admin ready: #{user.email} (role=#{user.role})"
  end
end
