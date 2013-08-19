{
    # Info for extension configuration files (package.json, manifest.json, etc)
    :name => 'gokosalvager',
    :version => 2.2,
    :title => 'Goko Dominion Salvager',
    :desc => 'Enhance your Online Dominion experience!',
    :author => 'The unofficial forum.dominionstrategy dev team',
    :contributors => [
        'philosophyguy',
        '1wheel',
        'michaeljb',
        'nutki',
        'ragingduckd',
        'yed'
    ],
    :icon16 => 'salvager16.png',
    :icon48 => 'salvager48.png',
    :icon128 => 'salvager128.png',
    :homepage => 'http://forum.dominionstrategy.com/index.php?topic=9063.0',
    :license => 'MPL 2.0',
    :manifest_version => '2',
    :safarixtz_url => 'http://goo.gl/1SJmbB',

    # The pages to run the extension on
    :targeturls => [
        'http://play.goko.com/Dominion/gameClient.html',
        'https://play.goko.com/Dominion/gameClient.html',
        'http://beta.goko.com/Dominion/gameClient.html',
        'https://beta.goko.com/Dominion/gameClient.html',
    ],

    # Domains to run the extension on (for Chrome)
    :domains => [
        'http://play.goko.com/',
        'https://play.goko.com/',
        'http://beta.goko.com/',
        'https://beta.goko.com/',
    ],

    # JS scripts for Goko to load, in order
    :js => [
        'externals.js',
        'settings.js',
        'kingdom_generator.js',
        'settingsDialog.js',
        'userSettings.js',
        'tableState.js',
        'autokick.js',
        'avatars.js',
        'blacklist.js',
        'logviewer.js',
        'lobby_ratings.js',
        'alwaysStack.js',
        'automatchGamePop.js',
        'automatchOfferPop.js',
        'automatchSeekPop.js',
        'automatch.js'
    ],
    :css => [
        'logviewer.css',
        'jquery-gokocolors.css'
    ]
}
