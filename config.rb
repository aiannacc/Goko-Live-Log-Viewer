{
    # Info for extension configuration files (package.json, manifest.json, etc)
    :name => 'gokosalvager',
    :version => '2.3.4.5',
    :title => 'Goko Dominion Salvager',
    :desc => 'Enhance your Online Dominion experience',
    :author => 'The unofficial forum.dominionstrategy dev team',
    :contributors => [
        'philosophyguy',
        'Adam Pearce (1wheel)',
        'nutki',
        'Michael Brandt (michaeljb)',
        'Andrew Iannaccone (ragingduckd)',
        'Zdenek Bouska (yed)'
    ],
    :icon16 => 'salvager16.png',
    :icon48 => 'salvager48.png',
    :icon128 => 'salvager128.png',
    :homepage => 'https://github.com/aiannacc/Goko-Salvager/wiki',
    :license => 'MPL 2.0',
    :manifest_version => '2',
    :safarixtz_url => 'http://goo.gl/1SJmbB',
    :targeturls => [
        'http://play.goko.com/Dominion/gameClient.html',
        'https://play.goko.com/Dominion/gameClient.html',
        'http://beta.goko.com/Dominion/gameClient.html',
        'https://beta.goko.com/Dominion/gameClient.html'
    ],
    :hostServer => 'www.gokosalvager.com',
    :hostDir => '/home/ai/code/goko-dominion-tools/web/static/gokosalvager/',
    :hostPort => '8888',
    :hostURLBase => '/',
    :extinfo => 'index.html',
    :extupdate => {
        :firefox => 'update_firefox.rdf',
        :chrome => 'update_chrome.xml',
        :safari => 'update_safari.plist'
    },
    :firefox_minversion => '19.0',
    :firefox_maxversion => '23.*',

    # AI's Safari Developer Certificate ID:
    :safari_dev_cert_id => '366P22F9M8',

    # CSS to be injected
    :css => [
        'logviewer.css',
        'jquery-gokocolors.css'
    ],

    :img => [
        'images/ui-icons_454545_256x240.png',
        'images/ui-icons_222222_256x240.png',
        'images/ui-bg_fine-grain_20_cbaa6e_60x60.png',
        'images/ui-bg_glass_65_ffffff_1x400.png',
        'images/ui-bg_glass_75_dadada_1x400.png',
        'images/ui-bg_glass_75_e6e6e6_1x400.png',
        'images/ui-icons_888888_256x240.png',
        'images/ui-bg_flat_0_aaaaaa_40x100.png',
        'images/ui-bg_fine-grain_10_c3c3c3_60x60.png'
    ],

    # Internally-stored versions, so be loaded by Chrome and Firefox. Safari
    # has to load external version.
    :jslib => [
        'jquery.ui.js',
        'angular.min.js'
    ],

    # JS scripts for Goko to load, in order
    :js => [
        'init.js',
        'utils.js',
        'settingsDialog.js',
        'eventLogger.js',
        'notifications.js',
        'kingdom_generator.js',
        'tableState.js',
        'autokick.js',
        'avatars.js',
        'blacklist.js',
        'sidebar.js',
        'logviewer.js',
        'chatbox.js',
        'vpcalculator.js',
        'vpcounterui.js',
        'vptoggle.js',
        'lobby_ratings.js',
        'alwaysStack.js',
        'decktracker.js',
        'automatchGamePop.js',
        'automatchOfferPop.js',
        'automatchSeekPop.js',
        'automatch.js',
        'module_loader.js'
    ]
}
