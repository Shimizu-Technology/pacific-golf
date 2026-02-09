# frozen_string_literal: true

Rails.application.routes.draw do
  # Health check
  get 'health' => 'health#show'
  get 'up' => 'rails/health#show', as: :rails_health_check

  # ActionCable WebSocket
  mount ActionCable.server => '/cable'

  # API routes
  namespace :api do
    namespace :v1 do
      # ===========================================
      # PUBLIC ENDPOINTS (no auth required)
      # ===========================================

      # Organizations (public)
      get 'organizations/:slug' => 'organizations#show'
      get 'organizations/:slug/tournaments' => 'organizations#tournaments'
      get 'organizations/:slug/tournaments/:tournament_slug' => 'organizations#tournament'

      # Current tournament (legacy, for backwards compatibility)
      get 'tournaments/current' => 'tournaments#current'

      # Registration (public)
      get 'golfers/registration_status' => 'golfers#registration_status'
      post 'golfers' => 'golfers#create'

      # Payment Links (public endpoints)
      get 'payment_links/:token' => 'payment_links#show'
      post 'payment_links/:token/checkout' => 'payment_links#create_checkout'

      # Checkout (public)
      post 'checkout' => 'checkout#create'
      post 'checkout/embedded' => 'checkout#create_embedded'
      post 'checkout/confirm' => 'checkout#confirm'
      get 'checkout/session/:session_id' => 'checkout#session_status'

      # Webhooks (public, authenticated via signature)
      post 'webhooks/stripe' => 'webhooks#stripe'

      # ===========================================
      # ADMIN ENDPOINTS (auth required)
      # ===========================================

      # Admin organizations
      get 'admin/organizations' => 'organizations#index'
      post 'admin/organizations' => 'organizations#create'
      patch 'admin/organizations/:id' => 'organizations#update'
      get 'admin/organizations/:slug/tournaments' => 'organizations#admin_tournaments'
      post 'admin/organizations/:slug/tournaments' => 'organizations#create_tournament'
      get 'admin/organizations/:slug/tournaments/:tournament_slug' => 'organizations#admin_tournament'
      post 'admin/organizations/:slug/tournaments/:tournament_slug/golfers' => 'organizations#create_golfer'
      patch 'admin/organizations/:slug/tournaments/:tournament_slug/golfers/:golfer_id' => 'organizations#update_golfer'
      post 'admin/organizations/:slug/tournaments/:tournament_slug/golfers/:golfer_id/cancel' => 'organizations#cancel_golfer'
      post 'admin/organizations/:slug/tournaments/:tournament_slug/golfers/:golfer_id/refund' => 'organizations#refund_golfer'

      # Tournaments (admin)
      resources :tournaments, except: [:create] do
        member do
          post :archive
          post :copy
          post :open
          post :close
        end
      end
      post 'admin/tournaments' => 'tournaments#create'

      # Golfers (admin)
      resources :golfers, except: [:create] do
        member do
          post :check_in
          post :undo_check_in
          post :payment_details
          post :promote
          post :demote
          post :update_payment_status
          post :cancel
          post :refund
          post :mark_refunded
          post :send_payment_link
        end
        collection do
          get :stats
          post :bulk_send_payment_links
        end
      end

      # Scores & Leaderboard
      scope 'tournaments/:tournament_id' do
        resources :scores, only: [:index, :create, :update, :destroy] do
          member do
            post :verify
          end
          collection do
            get :leaderboard
            get :scorecard
            post :batch
          end
        end
      end

      # Groups
      resources :groups do
        member do
          post :set_hole
          post :add_golfer
          post :remove_golfer
        end
        collection do
          post :update_positions
          post :batch_create
          post :auto_assign
        end
      end

      # Users/Admins (legacy endpoint name for backwards compatibility)
      resources :admins do
        collection do
          get :me
        end
      end

      # Settings (singleton resource)
      resource :settings, only: %i[show update]

      # Activity Logs
      resources :activity_logs, only: [:index] do
        collection do
          get :summary
          get 'golfer/:golfer_id', action: :golfer_history, as: :golfer_history
        end
      end
    end
  end
end
