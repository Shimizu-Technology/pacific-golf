# frozen_string_literal: true

module Api
  module V1
    class OrganizationsController < BaseController
      skip_before_action :authenticate_user!, only: [:show, :tournaments, :tournament]

      # GET /api/v1/organizations/:slug
      # Public endpoint - returns organization info
      def show
        organization = Organization.find_by_slug!(params[:slug])
        
        render json: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          description: organization.description,
          logo_url: organization.logo_url,
          primary_color: organization.primary_color,
          banner_url: organization.banner_url,
          contact_email: organization.contact_email,
          contact_phone: organization.contact_phone,
          website_url: organization.website_url,
          tournament_count: organization.tournament_count
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Organization not found' }, status: :not_found
      end

      # GET /api/v1/organizations/:slug/tournaments
      # Public endpoint - returns organization's public tournaments
      def tournaments
        organization = Organization.find_by_slug!(params[:slug])
        tournaments = organization.tournaments
                                  .where(status: %w[open closed in_progress completed])
                                  .order(event_date: :desc)

        render json: tournaments, each_serializer: TournamentSerializer
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Organization not found' }, status: :not_found
      end

      # GET /api/v1/organizations/:slug/tournaments/:tournament_slug
      # Public endpoint - returns specific tournament
      def tournament
        organization = Organization.find_by_slug!(params[:slug])
        tournament = organization.tournaments.find_by!(slug: params[:tournament_slug])

        render json: tournament, serializer: TournamentSerializer
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Tournament not found' }, status: :not_found
      end

      # POST /api/v1/admin/organizations
      # Super admin only - create new organization
      def create
        require_super_admin!
        return if performed?

        organization = Organization.new(organization_params)

        if organization.save
          render json: organization_response(organization), status: :created
        else
          render json: { errors: organization.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/admin/organizations/:id
      # Org admin only - update organization
      def update
        organization = Organization.find(params[:id])
        require_org_admin!(organization)
        return if performed?

        if organization.update(organization_params)
          render json: organization_response(organization)
        else
          render json: { errors: organization.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/admin/organizations
      # Returns organizations the current user can access
      def index
        organizations = current_user.accessible_organizations.order(:name)
        render json: organizations.map { |org| organization_response(org) }
      end

      # GET /api/v1/admin/organizations/:slug/tournaments
      # Admin endpoint - returns all tournaments with stats
      def admin_tournaments
        organization = Organization.find_by_slug!(params[:slug])
        require_org_admin!(organization)
        return if performed?

        tournaments = organization.tournaments.order(event_date: :desc)

        tournament_data = tournaments.map do |t|
          {
            id: t.id,
            name: t.name,
            slug: t.slug,
            date: t.event_date,
            status: t.status,
            registration_count: t.golfers.where(registration_status: 'confirmed').count,
            capacity: t.max_golfers,
            revenue: t.golfers.where(payment_status: 'paid').sum { |g| g.entry_fee_paid || 0 }
          }
        end

        stats = {
          total_tournaments: tournaments.count,
          active_tournaments: tournaments.where(status: %w[open in_progress]).count,
          total_registrations: organization.tournaments.joins(:golfers)
                                          .where(golfers: { registration_status: 'confirmed' }).count,
          total_revenue: organization.tournaments.joins(:golfers)
                                    .where(golfers: { payment_status: 'paid' })
                                    .sum('golfers.entry_fee_paid') || 0
        }

        render json: { tournaments: tournament_data, stats: stats }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Organization not found' }, status: :not_found
      end

      # GET /api/v1/admin/organizations/:slug/tournaments/:tournament_slug
      # Admin endpoint - returns tournament details with all golfers
      def admin_tournament
        organization = Organization.find_by_slug!(params[:slug])
        require_org_admin!(organization)
        return if performed?

        tournament = organization.tournaments.find_by!(slug: params[:tournament_slug])
        golfers = tournament.golfers.order(created_at: :desc)

        stats = {
          total_registrations: golfers.count,
          confirmed: golfers.where(registration_status: 'confirmed').count,
          waitlisted: golfers.where(registration_status: 'waitlist').count,
          cancelled: golfers.where(registration_status: 'cancelled').count,
          paid: golfers.where(payment_status: 'paid').count,
          unpaid: golfers.where(payment_status: 'unpaid').count,
          checked_in: golfers.where.not(checked_in_at: nil).count,
          revenue: golfers.where(payment_status: 'paid').sum { |g| g.entry_fee_paid || 0 }
        }

        render json: {
          tournament: tournament,
          golfers: golfers.as_json(
            only: [:id, :name, :email, :phone, :company, :registration_status, 
                   :payment_status, :payment_method, :checked_in_at, :created_at]
          ),
          stats: stats
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Tournament not found' }, status: :not_found
      end

      private

      def organization_params
        params.require(:organization).permit(
          :name, :slug, :description, :logo_url, :primary_color,
          :banner_url, :contact_email, :contact_phone, :website_url
        )
      end

      def organization_response(org)
        {
          id: org.id,
          name: org.name,
          slug: org.slug,
          description: org.description,
          logo_url: org.logo_url,
          primary_color: org.primary_color,
          banner_url: org.banner_url,
          contact_email: org.contact_email,
          contact_phone: org.contact_phone,
          website_url: org.website_url,
          subscription_status: org.subscription_status,
          tournament_count: org.tournament_count,
          admin_count: org.admin_count,
          created_at: org.created_at,
          updated_at: org.updated_at
        }
      end
    end
  end
end
