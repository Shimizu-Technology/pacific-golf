# frozen_string_literal: true

class TournamentMailer < ApplicationMailer
  # Send reminder email 1 day before tournament
  def reminder_email(golfer)
    @golfer = golfer
    @tournament = golfer.tournament
    @organization = @tournament.organization
    
    set_branding
    
    mail(
      to: golfer.email,
      subject: "Reminder: #{@tournament.name} is Tomorrow!"
    )
  end

  # Send day-of instructions on tournament morning
  def day_of_email(golfer)
    @golfer = golfer
    @tournament = golfer.tournament
    @organization = @tournament.organization
    
    set_branding
    
    mail(
      to: golfer.email,
      subject: "Today's the Day! #{@tournament.name} Instructions"
    )
  end

  # Send results summary after tournament completion
  def results_email(golfer, results_data = {})
    @golfer = golfer
    @tournament = golfer.tournament
    @organization = @tournament.organization
    @results = results_data
    
    set_branding
    
    mail(
      to: golfer.email,
      subject: "Results: #{@tournament.name}"
    )
  end

  private

  def set_branding
    @primary_color = @organization&.primary_color || '#1e40af'
    @org_name = @organization&.name || 'Pacific Golf'
    @logo_url = @organization&.logo_url
  end
end
