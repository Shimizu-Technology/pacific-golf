module MailerHelper
  def darken_color(hex_color, percent)
    hex = hex_color.gsub('#', '')
    r = [hex[0..1].to_i(16) * (100 - percent) / 100, 0].max
    g = [hex[2..3].to_i(16) * (100 - percent) / 100, 0].max
    b = [hex[4..5].to_i(16) * (100 - percent) / 100, 0].max
    "#%02x%02x%02x" % [r, g, b]
  end
end
