// package metadata file for Meteor.js

var packageName = 'juliomac:prettyphoto'; 
var where = 'client';  // where to install: 'client', 'server', or ['client', 'server']

Package.describe({
  name: packageName,
  summary: 'Prettyphoto is a full blown media lightbox. Supports images, videos, flash, YouTube and iFrames.',
  version: '4',
  git: 'https://github.com/juliomac/prettyphoto.git',
  documentation: 'README.md'
});

Package.onUse(function (api) {
  api.versionsFrom('1.1.0.2');
  api.addFiles([
    'js/jquery.prettyPhoto.js',
    'css/prettyPhoto.css',
    'images/prettyPhoto/dark_rounded/btnNext.png',
    'images/prettyPhoto/dark_rounded/btnPrevious.png',
    'images/prettyPhoto/dark_rounded/contentPattern.png',
    'images/prettyPhoto/dark_rounded/default_thumbnail.gif', 
    'images/prettyPhoto/dark_rounded/loader.gif',
    'images/prettyPhoto/dark_rounded/sprite.png',
    'images/prettyPhoto/dark_square/btnNext.png',
    'images/prettyPhoto/dark_square/btnPrevious.png',
    'images/prettyPhoto/dark_square/contentPattern.png',
    'images/prettyPhoto/dark_square/default_thumbnail.gif',
    'images/prettyPhoto/dark_square/loader.gif',
    'images/prettyPhoto/dark_square/sprite.png',
    'images/prettyPhoto/default/default_thumb.png',
    'images/prettyPhoto/default/loader.gif',
    'images/prettyPhoto/default/sprite_next.png',
    'images/prettyPhoto/default/sprite_prev.png',
    'images/prettyPhoto/default/sprite_x.png',
    'images/prettyPhoto/default/sprite_y.png',
    'images/prettyPhoto/default/sprite.png',
    'images/prettyPhoto/facebook/btnNext.png',
    'images/prettyPhoto/facebook/btnPrevious.png',
    'images/prettyPhoto/facebook/contentPatternBottom.png',
    'images/prettyPhoto/facebook/contentPatternLeft.png',
    'images/prettyPhoto/facebook/contentPatternRight.png',
    'images/prettyPhoto/facebook/contentPatternTop.png',
    'images/prettyPhoto/facebook/default_thumbnail.gif',
    'images/prettyPhoto/facebook/loader.gif',
    'images/prettyPhoto/facebook/sprite.png',
    'images/prettyPhoto/light_rounded/btnNext.png',
    'images/prettyPhoto/light_rounded/btnPrevious.png',
    'images/prettyPhoto/light_rounded/default_thumbnail.gif',
    'images/prettyPhoto/light_rounded/loader.gif',
    'images/prettyPhoto/light_rounded/sprite.png',
    'images/prettyPhoto/light_square/btnNext.png',   
    'images/prettyPhoto/light_square/btnPrevious.png',
    'images/prettyPhoto/light_square/default_thumbnail.gif',
    'images/prettyPhoto/light_square/loader.gif',
    'images/prettyPhoto/light_square/sprite.png'
  ], where);
});

Package.onTest(function (api) {
  api.use(packageName, where);
  api.use(['tinytest', 'http'], where);

  // TODO we should just bring in src/test.html - but how to do that with TinyTest?
  api.addFiles('prettyphoto-tests.js', where);
});
