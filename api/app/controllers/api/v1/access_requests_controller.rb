# frozen_string_literal: true

module Api
  module V1
    class AccessRequestsController < BaseController
      skip_before_action :authenticate_user!, only: [:create]
      before_action :set_access_request, only: [:update]

      # POST /api/v1/access_requests
      # Public endpoint used by the homepage "Request Access" form.
      def create
        # Honeypot trap for basic bot submissions.
        if params[:website].present?
          return render json: { message: "Request submitted successfully." }, status: :accepted
        end

        access_request = AccessRequest.new(access_request_params)

        if access_request.save
          AccessRequestMailer.notify_new_request(access_request).deliver_later
          render json: { message: "Request submitted successfully." }, status: :created
        else
          render json: { errors: access_request.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/admin/access_requests
      # Super-admin endpoint for triage dashboard.
      def index
        require_super_admin!
        return if performed?

        access_requests = AccessRequest.recent.limit(200)

        render json: access_requests.map { |request| serialize_access_request(request) }
      end

      # PATCH /api/v1/admin/access_requests/:id
      # Super-admin endpoint to update request status.
      def update
        require_super_admin!
        return if performed?

        next_status = access_request_update_params[:status]
        reviewed_now = next_status.present? && next_status != @access_request.status

        if @access_request.update(
          access_request_update_params.merge(
            reviewed_at: reviewed_now ? Time.current : @access_request.reviewed_at,
            reviewed_by: reviewed_now ? current_user : @access_request.reviewed_by
          )
        )
          render json: serialize_access_request(@access_request)
        else
          render json: { errors: @access_request.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_access_request
        @access_request = AccessRequest.find(params[:id])
      end

      def access_request_params
        params.require(:access_request).permit(
          :organization_name,
          :contact_name,
          :email,
          :phone,
          :notes,
          :source
        )
      end

      def access_request_update_params
        params.require(:access_request).permit(:status)
      end

      def serialize_access_request(request)
        {
          id: request.id,
          organization_name: request.organization_name,
          contact_name: request.contact_name,
          email: request.email,
          phone: request.phone,
          notes: request.notes,
          status: request.status,
          source: request.source,
          reviewed_at: request.reviewed_at,
          reviewed_by: request.reviewed_by&.email,
          created_at: request.created_at
        }
      end
    end
  end
end
