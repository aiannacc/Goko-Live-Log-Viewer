require 'watir-webdriver'
b = Watir::Browser.new :firefox, :profile => 'tester'
b.goto 'https://play.goko.com/Dominion/gameClient.html'
b.a(:id => 'fs-lg-meeting-room').wait_until_present
b.a(:id => 'fs-lg-meeting-room').click
b.ul(:class => 'fs-player-list').wait_until_present
#b.div(:class => 'fs-lg-settings-btn').click
