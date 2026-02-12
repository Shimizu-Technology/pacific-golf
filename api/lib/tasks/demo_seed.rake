# frozen_string_literal: true

namespace :demo do
  desc "Seed Make-A-Wish Guam demo data (org, tournament, sponsors, golfers, scores)"
  task seed_maw: :environment do
    puts "Seeding Make-A-Wish Guam & CNMI demo data..."

    # =========================================================================
    # Organization
    # =========================================================================
    org = Organization.find_or_create_by!(slug: 'make-a-wish-guam') do |o|
      o.name = 'Make-A-Wish Guam & CNMI'
      o.description = 'Together, we create life-changing wishes for children with critical illnesses. Make-A-Wish Guam & CNMI has been granting wishes since 1988, bringing hope and joy to families across our islands.'
      o.primary_color = '#0057B8'
      o.contact_email = 'guamcnmi@wish.org'
      o.contact_phone = '671-649-9474'
      o.website_url = 'https://wish.org/guamcnmi'
    end
    puts "  - Organization: #{org.name} (#{org.slug})"

    # =========================================================================
    # Tournament
    # =========================================================================
    tournament = Tournament.find_or_create_by!(
      organization: org,
      slug: 'wishes-on-the-green-2026'
    ) do |t|
      t.name = '1st Annual Wishes on the Green Golf Tournament'
      t.event_date = Date.new(2026, 4, 12)
      t.registration_time = '7:00 AM'
      t.start_time = '8:30 AM Shotgun Start'
      t.location_name = 'Starts Golf Course'
      t.location_address = 'Dededo, Guam'
      t.tournament_format = 'scramble'
      t.team_size = 4
      t.entry_fee_cents = 20000
      t.max_capacity = 120
      t.status = 'open'
      t.total_holes = 18
      t.total_par = 72
      t.allow_card = true
      t.allow_cash = true
      t.allow_check = true
      t.checks_payable_to = 'Make-A-Wish Foundation of Guam & CNMI'
      t.fee_includes = 'Green Fee, Cart, Lunch, Drinks, Awards Ceremony, and Raffle Entry'
      t.contact_name = 'Make-A-Wish Guam Events Committee'
      t.contact_phone = '671-649-9474'
      t.format_name = 'Scramble (4-Person Teams)'
    end
    puts "  - Tournament: #{tournament.name}"

    # =========================================================================
    # Sponsors
    # =========================================================================
    sponsors_data = [
      { name: 'Bank of Guam', tier: 'title', website_url: 'https://bankofguam.com' },
      { name: 'Docomo Pacific', tier: 'platinum', website_url: 'https://docomopacific.com' },
      { name: 'Triple J Auto Group', tier: 'platinum', website_url: 'https://triplejguam.com' },
      { name: 'IT&E', tier: 'gold', website_url: 'https://ite.net' },
      { name: 'Matson', tier: 'gold', website_url: 'https://matson.com' },
      { name: 'Hyatt Regency Guam', tier: 'gold', website_url: 'https://hyatt.com/hyatt-regency/guam' },
      { name: 'Coast 360 Federal Credit Union', tier: 'silver', website_url: 'https://coast360fcu.com' },
      { name: 'Guam Premier Outlets', tier: 'silver', website_url: 'https://gpoguam.com' },
      { name: 'Island Insurance', tier: 'bronze' },
      { name: 'Pacific Daily News', tier: 'bronze', website_url: 'https://guampdn.com' },
    ]

    sponsors_data.each do |s|
      Sponsor.find_or_create_by!(tournament: tournament, name: s[:name]) do |sp|
        sp.tier = s[:tier]
        sp.website_url = s[:website_url]
      end
    end
    puts "  - #{sponsors_data.length} sponsors created"

    # Hole Sponsors
    hole_sponsors_data = [
      { name: "Calvo's Insurance", hole_number: 1 },
      { name: "McDonald's of Guam", hole_number: 2 },
      { name: 'Pay-Less Supermarkets', hole_number: 3 },
      { name: 'Guam Reef Hotel', hole_number: 9 },
      { name: 'Ambros Inc', hole_number: 10 },
      { name: 'Staywell Health Plan', hole_number: 14 },
      { name: 'Hawaiian Rock Products', hole_number: 18 },
    ]

    hole_sponsors_data.each do |s|
      Sponsor.find_or_create_by!(tournament: tournament, name: s[:name]) do |sp|
        sp.tier = 'hole'
        sp.hole_number = s[:hole_number]
      end
    end
    puts "  - #{hole_sponsors_data.length} hole sponsors created"

    # =========================================================================
    # Golfers (24 confirmed registrations)
    # =========================================================================
    golfers_data = [
      ["John Santos", "Bank of Guam"], ["Maria Cruz", "Docomo Pacific"],
      ["David Tydingco", "Triple J Auto"], ["Sarah Kim", "IT&E"],
      ["Robert Flores", "Matson"], ["Jennifer Ada", "Hyatt Regency Guam"],
      ["Michael Reyes", "Coast 360 FCU"], ["Lisa Bautista", "Pay-Less"],
      ["James Perez", nil], ["Anna Tenorio", nil],
      ["Chris Borja", "Guam Premier Outlets"], ["Michelle Camacho", nil],
      ["Daniel Guerrero", "Island Insurance"], ["Karen Pangelinan", nil],
      ["Mark Manibusan", "Calvo Insurance"], ["Emily Duenas", nil],
      ["Ryan Sablan", "Hawaiian Rock"], ["Nicole Charfauros", nil],
      ["Kevin Leon Guerrero", "Ambros Inc"], ["Amy Quitugua", nil],
      ["Brian Taimanglo", nil], ["Christine Unpingco", "Staywell"],
      ["Tony Shimizu", "Pacific Daily News"], ["Grace Aguon", nil],
    ]

    golfers_data.each_with_index do |(name, company), i|
      Golfer.find_or_create_by!(tournament: tournament, email: "golfer#{i + 1}@example.com") do |g|
        g.name = name
        g.phone = "671-555-#{(200 + i).to_s.rjust(4, '0')}"
        g.company = company
        g.registration_status = 'confirmed'
        g.payment_status = 'paid'
        g.payment_type = 'stripe'
        g.waiver_accepted_at = Time.current
      end
    end
    puts "  - #{golfers_data.length} golfers registered"

    # =========================================================================
    # Groups & Scores (6 teams of 4, scramble format)
    # =========================================================================
    pars = [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4]

    team_adjustments = {
      1 => [0, -1, -1, 0, -1, -1, 0, -1, 0, 0, -1, -1, 0, -1, 0, 0, -1, 0],
      2 => [0, -1, 0, 0, -1, -1, 0, -1, 0, -1, 0, -1, 0, 0, -1, 0, -1, 0],
      3 => [0, 0, -1, 0, -1, 0, 0, -1, -1, 0, -1, 0, 0, 0, -1, 0, -1, 0],
      4 => [0, 0, -1, 1, -1, 0, 0, 0, 0, 0, -1, -1, 0, 0, 0, 0, -1, 0],
      5 => [-1, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, -1, 1, 0, 0, -1, 0, 0],
      6 => [0, 0, 0, 0, -1, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0],
    }
    holes_completed = { 1 => 18, 2 => 18, 3 => 16, 4 => 15, 5 => 14, 6 => 12 }

    golfers = tournament.golfers.confirmed.order(:id).to_a
    start_holes = [1, 4, 7, 10, 13, 16]

    6.times do |i|
      group = Group.find_or_create_by!(tournament: tournament, group_number: i + 1) do |g|
        g.hole_number = start_holes[i]
      end

      # Assign golfers
      4.times do |j|
        idx = (i * 4) + j
        next if idx >= golfers.length
        golfers[idx].update!(group: group) unless golfers[idx].group_id == group.id
      end

      # Create scores
      completed = holes_completed[i + 1]
      completed.times do |h|
        hole = h + 1
        strokes = pars[h] + team_adjustments[i + 1][h]

        Score.find_or_create_by!(
          tournament: tournament,
          group: group,
          hole: hole,
          score_type: 'team'
        ) do |s|
          s.strokes = strokes
          s.par = pars[h]
          s.verified = true
        end
      end
    end
    puts "  - 6 groups with scores created"

    puts "\nMake-A-Wish demo data seeded successfully!"
    puts "   Visit: /:orgSlug → /make-a-wish-guam"
  end
end
