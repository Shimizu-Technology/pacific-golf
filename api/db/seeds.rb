# frozen_string_literal: true

# Pacific Golf Seeds
# Seeds for development and testing

puts "Seeding Pacific Golf database..."

# Create default organization
org = Organization.find_or_create_by!(slug: 'rotary-guam') do |o|
  o.name = 'Rotary Club of Guam'
  o.description = 'The Rotary Club of Guam is a service organization dedicated to improving lives in the community.'
  o.primary_color = '#1e40af'  # Rotary blue
  o.contact_email = 'golf@rotaryguam.org'
  o.contact_phone = '671-555-0123'
  o.website_url = 'https://rotaryguam.org'
end
puts "  Created organization: #{org.name} (#{org.slug})"

# Create a second organization for testing
org2 = Organization.find_or_create_by!(slug: 'chamber-of-commerce') do |o|
  o.name = 'Guam Chamber of Commerce'
  o.description = 'The Guam Chamber of Commerce supports local businesses and economic development.'
  o.primary_color = '#047857'  # Chamber green
  o.contact_email = 'events@guamchamber.com'
  o.contact_phone = '671-555-0456'
  o.website_url = 'https://guamchamber.com'
end
puts "  Created organization: #{org2.name} (#{org2.slug})"

# Optional bootstrap super admin from environment
bootstrap_admin_email = ENV["BOOTSTRAP_SUPER_ADMIN_EMAIL"]&.strip&.downcase
bootstrap_admin_name = ENV["BOOTSTRAP_SUPER_ADMIN_NAME"]&.strip
admin = nil

if bootstrap_admin_email.present?
  admin = User.find_or_initialize_by(email: bootstrap_admin_email)
  admin.name = bootstrap_admin_name if bootstrap_admin_name.present?
  admin.role = "super_admin"
  admin.save!
  puts "  Bootstrapped super admin: #{admin.email}"

  # Optional for local convenience: add bootstrap admin to seeded orgs
  org.add_admin(admin)
  org2.add_admin(admin)
  puts "  Added #{admin.email} to seeded organizations"
else
  puts "  Skipped super admin bootstrap (set BOOTSTRAP_SUPER_ADMIN_EMAIL to enable)"
end

# Create settings (singleton)
Setting.find_or_create_by!(id: 1) do |s|
  s.stripe_public_key = ENV['STRIPE_PUBLISHABLE_KEY']
  s.stripe_secret_key = ENV['STRIPE_SECRET_KEY']
  s.payment_mode = 'test'
  s.admin_email = 'admin@pacificgolf.io'
end
puts "  Created settings"

# Create a sample tournament for Rotary
tournament = Tournament.find_or_create_by!(organization: org, name: 'Rotary Charity Classic', year: 2026) do |t|
  t.edition = '15th Annual'
  t.status = 'open'
  t.registration_open = true
  t.event_date = 'March 15, 2026'
  t.registration_time = '11:00 AM'
  t.start_time = '12:30 PM'
  t.location_name = 'Country Club of the Pacific'
  t.location_address = 'Yona, Guam'
  t.max_capacity = 144
  t.reserved_slots = 12
  t.entry_fee = 15000  # $150
  t.format_name = 'Scramble'
  t.fee_includes = 'Green Fee, Cart, Lunch, Drinks, and Prizes'
  t.checks_payable_to = 'Rotary Club of Guam Foundation'
  t.contact_name = 'Tournament Committee'
  t.contact_phone = '671-555-0123'
end
puts "  Created tournament: #{tournament.display_name}"

# Create a draft tournament for Chamber
tournament2 = Tournament.find_or_create_by!(organization: org2, name: 'Chamber Amateur Golf Tournament', year: 2026) do |t|
  t.edition = '10th Annual'
  t.status = 'draft'
  t.registration_open = false
  t.event_date = 'April 20, 2026'
  t.registration_time = '10:30 AM'
  t.start_time = '12:00 PM'
  t.location_name = 'Finest Guam Golf & Resort'
  t.location_address = 'Dededo, Guam'
  t.max_capacity = 120
  t.reserved_slots = 8
  t.entry_fee = 17500  # $175
  t.format_name = 'Best Ball'
  t.fee_includes = 'Green Fee, Cart, Lunch, and Awards Dinner'
  t.checks_payable_to = 'Guam Chamber of Commerce'
  t.contact_name = 'Events Team'
  t.contact_phone = '671-555-0456'
end
puts "  Created tournament: #{tournament2.display_name}"

puts "\nSeeding complete!"
puts "\nOrganizations:"
puts "  - #{org.name} (#{org.slug}) - #{org.tournaments.count} tournament(s)"
puts "  - #{org2.name} (#{org2.slug}) - #{org2.tournaments.count} tournament(s)"
if admin
  puts "\nAdmin user: #{admin.email} (#{admin.role})"
else
  puts "\nAdmin user: not bootstrapped from seeds"
end
puts "\nOpen tournament: #{tournament.name} - #{tournament.full_url}"
