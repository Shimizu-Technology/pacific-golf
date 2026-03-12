# frozen_string_literal: true

class AccessRequest < ApplicationRecord
  belongs_to :reviewed_by, class_name: "User", optional: true

  STATUSES = %w[new contacted qualified closed].freeze
  SOURCES = %w[homepage manual referral unknown].freeze

  validates :organization_name, presence: true, length: { maximum: 120 }
  validates :contact_name, presence: true, length: { maximum: 120 }
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :phone, length: { maximum: 40 }, allow_blank: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :source, presence: true, inclusion: { in: SOURCES }

  before_validation :normalize_email
  before_validation :normalize_source

  scope :recent, -> { order(created_at: :desc) }
  scope :open_items, -> { where(status: %w[new contacted]) }

  private

  def normalize_email
    self.email = email.to_s.downcase.strip
  end

  def normalize_source
    normalized_source = source.to_s.downcase.strip
    self.source = normalized_source.presence || "homepage"
  end
end
