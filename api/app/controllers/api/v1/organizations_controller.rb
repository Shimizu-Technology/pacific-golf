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
      # Public endpoint - returns specific tournament with sponsors
      def tournament
        organization = Organization.find_by_slug!(params[:slug])
        tournament = organization.tournaments.find_by!(slug: params[:tournament_slug])
        
        # Get active sponsors grouped by tier
        sponsors = tournament.sponsors.active.ordered.map do |s|
          {
            id: s.id,
            name: s.name,
            tier: s.tier,
            tier_display: s.tier_display,
            logo_url: s.logo_url,
            website_url: s.website_url,
            description: s.description,
            hole_number: s.hole_number,
            major: s.major?
          }
        end

        # Render tournament with sponsors
        tournament_data = TournamentSerializer.new(tournament).as_json
        tournament_data[:sponsors] = sponsors
        
        render json: tournament_data
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
            capacity: t.max_capacity,
            revenue: t.golfers.where(payment_status: 'paid').count * (t.entry_fee || 0)
          }
        end

        # Calculate total revenue by summing entry fees of paid golfers
        total_revenue = 0
        tournaments.each do |t|
          paid_count = t.golfers.where(payment_status: 'paid').count
          total_revenue += paid_count * (t.entry_fee || 0)
        end

        stats = {
          total_tournaments: tournaments.count,
          active_tournaments: tournaments.where(status: %w[open in_progress]).count,
          total_registrations: organization.tournaments.joins(:golfers)
                                          .where(golfers: { registration_status: 'confirmed' }).count,
          total_revenue: total_revenue
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

        paid_count = golfers.where(payment_status: 'paid').count
        stats = {
          total_registrations: golfers.count,
          confirmed: golfers.where(registration_status: 'confirmed').count,
          waitlisted: golfers.where(registration_status: 'waitlist').count,
          cancelled: golfers.where(registration_status: 'cancelled').count,
          paid: paid_count,
          unpaid: golfers.where(payment_status: 'unpaid').count,
          checked_in: golfers.where.not(checked_in_at: nil).count,
          revenue: paid_count * (tournament.entry_fee || 0)
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

      # POST /api/v1/admin/organizations/:slug/tournaments
      # Create a new tournament for the organization
      def create_tournament
        organization = Organization.find_by_slug!(params[:slug])
        require_org_admin!(organization)
        return if performed?

        tournament = organization.tournaments.build(tournament_params)
        
        # Generate slug if not provided
        if tournament.slug.blank?
          base_slug = "#{tournament.name.parameterize}-#{tournament.year}"
          tournament.slug = base_slug
          
          # Ensure uniqueness
          counter = 1
          while organization.tournaments.exists?(slug: tournament.slug)
            tournament.slug = "#{base_slug}-#{counter}"
            counter += 1
          end
        end

        if tournament.save
          render json: { 
            tournament: tournament.as_json(
              only: [:id, :name, :slug, :year, :edition, :status, :event_date, 
                     :location_name, :entry_fee, :max_capacity]
            ),
            message: 'Tournament created successfully'
          }, status: :created
        else
          render json: { error: tournament.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Organization not found' }, status: :not_found
      end

      # POST /api/v1/admin/organizations/:slug/tournaments/:tournament_slug/golfers
      # Admin endpoint - create a golfer (manual registration)
      def create_golfer
        organization = Organization.find_by_slug!(params[:slug])
        require_org_admin!(organization)
        return if performed?

        tournament = organization.tournaments.find_by!(slug: params[:tournament_slug])
        golfer = tournament.golfers.build(golfer_params)

        if golfer.save
          render json: {
            golfer: golfer.as_json(
              only: [:id, :name, :email, :phone, :company, :registration_status,
                     :payment_status, :payment_method, :notes, :created_at]
            ),
            message: 'Golfer added successfully'
          }, status: :created
        else
          render json: { error: golfer.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Tournament not found' }, status: :not_found
      end

      # PATCH /api/v1/admin/organizations/:slug/tournaments/:tournament_slug/golfers/:golfer_id
      # Admin endpoint - update a golfer
      def update_golfer
        organization = Organization.find_by_slug!(params[:slug])
        require_org_admin!(organization)
        return if performed?

        tournament = organization.tournaments.find_by!(slug: params[:tournament_slug])
        golfer = tournament.golfers.find(params[:golfer_id])

        if golfer.update(golfer_params)
          render json: {
            golfer: golfer_response(golfer),
            message: 'Golfer updated successfully'
          }
        else
          render json: { error: golfer.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Golfer not found' }, status: :not_found
      end

      # POST /api/v1/admin/organizations/:slug/tournaments/:tournament_slug/golfers/:golfer_id/cancel
      # Admin endpoint - cancel a golfer's registration
      def cancel_golfer
        organization = Organization.find_by_slug!(params[:slug])
        require_org_admin!(organization)
        return if performed?

        tournament = organization.tournaments.find_by!(slug: params[:tournament_slug])
        golfer = tournament.golfers.find(params[:golfer_id])

        if golfer.registration_status == 'cancelled'
          render json: { error: 'Registration already cancelled' }, status: :unprocessable_entity
          return
        end

        golfer.update!(registration_status: 'cancelled')
        
        render json: {
          golfer: golfer_response(golfer),
          message: 'Registration cancelled successfully'
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Golfer not found' }, status: :not_found
      end

      # POST /api/v1/admin/organizations/:slug/tournaments/:tournament_slug/golfers/:golfer_id/refund
      # Admin endpoint - mark golfer as refunded (manual refund tracking)
      def refund_golfer
        organization = Organization.find_by_slug!(params[:slug])
        require_org_admin!(organization)
        return if performed?

        tournament = organization.tournaments.find_by!(slug: params[:tournament_slug])
        golfer = tournament.golfers.find(params[:golfer_id])

        if golfer.payment_status == 'refunded'
          render json: { error: 'Already refunded' }, status: :unprocessable_entity
          return
        end

        if golfer.payment_status != 'paid'
          render json: { error: 'Cannot refund unpaid registration' }, status: :unprocessable_entity
          return
        end

        # For now, just mark as refunded (manual tracking)
        # TODO: Integrate Stripe refund for online payments
        golfer.update!(
          payment_status: 'refunded',
          registration_status: 'cancelled'
        )
        
        render json: {
          golfer: golfer_response(golfer),
          message: 'Refund recorded successfully'
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Golfer not found' }, status: :not_found
      end

      private

      def golfer_response(golfer)
        golfer.as_json(
          only: [:id, :name, :email, :phone, :company, :registration_status,
                 :payment_status, :payment_method, :payment_type, :notes, 
                 :checked_in_at, :created_at, :updated_at]
        )
      end

      def golfer_params
        params.require(:golfer).permit(
          :name, :email, :phone, :mobile, :company, :address,
          :payment_type, :payment_status, :payment_method,
          :registration_status, :notes, :waiver_accepted_at
        )
      end

      def tournament_params
        params.require(:tournament).permit(
          :name, :year, :edition, :status, :slug,
          :event_date, :registration_time, :start_time, :check_in_time,
          :location_name, :location_address,
          :tournament_format, :scoring_type, :team_size, :shotgun_start,
          :max_capacity, :reserved_slots, :waitlist_enabled, :waitlist_max,
          :entry_fee, :early_bird_fee, :early_bird_deadline,
          :allow_cash, :allow_check, :allow_card, :checks_payable_to, :payment_instructions,
          :registration_deadline,
          :contact_name, :contact_phone, :fee_includes
        )
      end

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
