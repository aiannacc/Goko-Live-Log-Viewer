Goko Dominion Salvager
======================

Discuss the extension at the [Dominion Strategy forum](http://forum.dominionstrategy.com/index.php?topic=9063.0).


Installation
------------
- Chrome - [get it from the Chrome web store](https://chrome.google.com/webstore/detail/goko-dominion-salvager/kaignighoceeemhinbbophdeogpnedjn?hl=en-US)
- Firefox - [download the .xpi file](https://www.gokosalvager.com:8888/v2.4.3/gokosalvager.xpi), then open your Add-ons menu and "Install Add-ons from file."  Depending on your Firefox settings, it may also work to just single-click the link.
- Safari - [download the extension file](https://www.gokosalvager.com:8888/safari-latest-gokosalvager.safariextz), and double-click on it to add it to Safari

Contributing
------------
If you'd like to contribute, either fork this project and submit your changes via pull request, or ask [aiannacc](https://github.com/aiannacc) to make you a collaborator. [This](https://github.com/aiannacc/Goko-Salvager) is the project's central repository.

If you become a collaborator, please follow the [Feature Branch
Workflow](https://www.atlassian.com/git/workflows#!workflow-feature-branch) model. In brief:

1. Create a new branch from master
2. Make and test your changes locally
3. Create a pull request that merges your branch into master
4. Ask a collaborator to verify your changes and handle the pull request

We have rake tasks for building and testing the extension. Running `rake build` will generate the Firefox, Chrome, and Safari extension files.  They all require Ruby (for rake) and a \*nix environment, plus you'll also need the [Firefox Add-On SDK](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/) to build for Firefox. Building for Safari is a little more involved. See `tasks/safari.rake` and the blog it links to for more information.

Contributors
------------
- philosophyguy
- nutki
- Adam Pearce (1wheel)
- Michael Brandt (michaeljb)
- Andrew Iannaccone (ragingduckd)
- Zdenek Bouska (yed)
