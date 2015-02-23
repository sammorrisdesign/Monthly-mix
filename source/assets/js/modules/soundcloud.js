define([
    'libs/bean',
    'libs/bonzo',
    'libs/qwery',
    'utils/loadJSON',
    'sc'
], function(
    bean,
    bonzo,
    qwery,
    loadJSON
) {
    var sound;

    return {
        init: function() {
            loadJSON('/soundcloud-keys.json', function(data) {
                SC.initialize({
                    client_id: data.id
                });
            });

            this.bindEvents();
        },

        bindEvents: function() {
            bean.on(document.body, 'click', '.track', function(e) {
                this.playTrack(e.currentTarget.dataset.trackId);
            }.bind(this));
        },

        loadingState: function(target, state) {
            if (state === true) {
                target.addClass("is-loading");
            } else {
                target.removeClass("is-loading");
            }
        },

        onPlay: function(target) {
            target.addClass('is-playing');
        },

        onStop: function(target) {
            target.removeClass('is-playing');
        },

        playTrack: function(trackId) {
            el = bonzo(qwery('#track-' + trackId));
            current = bonzo(qwery('.is-playing'));

            // Set options for player
            var myOptions = {
                onload : function() {
                    // Debug onfinish with this
                    // sound.setPosition(this.duration - 3000);
                },
                onfinish : function(){
                    next = bonzo(qwery('.is-playing')).next().attr('data-track-id');
                    this.playTrack(next);
                }.bind(this),
                onbufferchange: function() {
                    this.loadingState(el, sound.playState);
                }.bind(this),
                onplay: function() {
                    this.loadingState(el, true);
                }.bind(this)
            }

            if (sound) {
                // Check if it's the same track
                if (sound.url.split('/')[4] == trackId) {
                    if (el.hasClass('is-playing')) {
                        sound.pause();
                        this.onStop(el);
                    } else {
                        sound.play();
                        this.onPlay(el);
                    }
                // If not, destroy old track and start again
                } else {
                    sound.stop();
                    this.onStop(current);
                    sound = undefined;
                    this.playTrack(trackId);
                }
            // First time playing of new track
            } else {
                context = this;
                SC.whenStreamingReady(function() {
                    var obj = SC.stream('/tracks/' + trackId, myOptions, function(obj){
                        obj.play();
                        sound = obj;
                        context.onPlay(el);
                    });
                    sound.load();
                });
            }
        }
    }
});