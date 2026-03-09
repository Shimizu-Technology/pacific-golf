# frozen_string_literal: true

module Api
  module V1
    class DevAuthController < ApplicationController
      before_action :ensure_dev_bypass_enabled!

      # POST /api/v1/dev/login
      # Body: { email: "user@example.com" }
      # Returns a dev token that bypasses Clerk auth
      def login
        email = params[:email]
        user = User.find_by(email: email)

        unless user
          render json: { error: "No user found with email: #{email}" }, status: :not_found
          return
        end

        token = "dev_token_#{user.id}"

        render json: {
          token: token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      end

      # GET /api/v1/dev/users
      # Lists all users for the dev login picker
      def users
        users = User.all.map do |u|
          {
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role
          }
        end

        render json: { users: users }
      end

      private

      def ensure_dev_bypass_enabled!
        dev_bypass_enabled = ENV.fetch("ENABLE_DEV_AUTH_BYPASS", "false") == "true"

        unless Rails.env.development? && dev_bypass_enabled
          render json: { error: "Dev auth bypass is disabled" }, status: :forbidden
        end
      end
    end
  end
end
