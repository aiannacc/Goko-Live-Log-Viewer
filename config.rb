{
    # Info for extension configuration files (package.json, manifest.json, etc)
    :name => 'gokosalvager',
    :version => '2.3',
    :title => 'Goko Dominion Salvager',
    :desc => 'Enhance your Online Dominion experience!',
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
    :homepage => 'http://forum.dominionstrategy.com/index.php?topic=9063.0',
    :license => 'MPL 2.0',
    :manifest_version => '2',
    :safarixtz_url => 'http://goo.gl/1SJmbB',
    :targeturls => [
        '*.goko.com'
    ],

    # JS scripts for Goko to load, in order
    :js => [
        'jquery.ui.js',
        'angular.min.js',
        'utils.js',
        'settings.js',
        'kingdom_generator.js',
        'settingsDialog.js',
        'userSettings.js',
        'tableState.js',
        'autokick.js',
        'avatars.js',
        'blacklist.js',
        'sidebar.js',
        'logviewer.js',
        'vpcounter.js',
        'lobby_ratings.js',
        'alwaysStack.js',
        'decktracker.js',
        'automatchGamePop.js',
        'automatchOfferPop.js',
        'automatchSeekPop.js',
        'automatch.js'
    ],

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
    ]
}
