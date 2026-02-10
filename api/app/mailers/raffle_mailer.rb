# frozen_string_literal: true

class RaffleMailer < ApplicationMailer
  # Send winner notification email
  def winner_email(raffle_prize)
    @prize = raffle_prize
    @tournament = raffle_prize.tournament
    @organization = @tournament.organization
    @ticket = raffle_prize.winning_ticket
    
    return unless @prize.winner_email.present?
    
    set_branding
    
    mail(
      to: @prize.winner_email,
      subject: "🎉 Congratulations! You Won: #{@prize.name}"
    )
  end

  # Send claim reminder if prize not claimed within X days
  def claim_reminder_email(raffle_prize)
    @prize = raffle_prize
    @tournament = raffle_prize.tournament
    @organization = @tournament.organization
    
    return unless @prize.winner_email.present?
    
    set_branding
    
    mail(
      to: @prize.winner_email,
      subject: "Reminder: Claim Your Prize - #{@prize.name}"
    )
  end

  # Send ticket purchase confirmation
  def ticket_confirmation_email(raffle_ticket)
    @ticket = raffle_ticket
    @tournament = raffle_ticket.tournament
    @organization = @tournament.organization
    @golfer = raffle_ticket.golfer
    
    return unless @golfer&.email.present?
    
    set_branding
    
    mail(
      to: @golfer.email,
      subject: "Raffle Ticket Confirmed: #{@ticket.ticket_number}"
    )
  end

  private

  def set_branding
    @primary_color = @organization&.primary_color || '#1e40af'
    @org_name = @organization&.name || 'Pacific Golf'
    @logo_url = @organization&.logo_url
  end
end
