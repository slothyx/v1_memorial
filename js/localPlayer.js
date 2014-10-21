/*globals jQuery, window, swfobject*/
(function($, window, swfobject, undefined) {
	"use strict";
	var YTPLAYER_RAW_HTML_ID = "slothyxPlayer";
	var YTPLAYER_HTML_ID = "#" + YTPLAYER_RAW_HTML_ID;
	$(function() {
		var params = { allowScriptAccess: "always" };
		var atts = { id: YTPLAYER_RAW_HTML_ID };
		swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid=ytplayer&version=3",
			"ytPlayer", "320", "300", "8", null, null, params, atts);
	});

	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;
	var localPlayer = slothyx.localPlayer = {};

	var playerProxy = new PlayerProxy();
	var ytPlayer;
	var localPayerOnStateChangeCallback;

	localPlayer.onYouTubePlayerReady = function() {
		ytPlayer = new LocalPlayer(YTPLAYER_HTML_ID);
		playerProxy.setPlayer(ytPlayer);
	};

	localPlayer.requestFullscreen = function() {
		ytPlayer.requestFullscreen();
	};

	localPlayer.getPlayer = function() {
		return playerProxy;
	};

	localPlayer.onLocalPlayerStateChange = function(state) {
		if(localPayerOnStateChangeCallback !== undefined) {
			localPayerOnStateChangeCallback(state);
		}
	};

	localPlayer.setYTPlayer = function(player) {
		playerProxy.setPlayer(player);
		ytPlayer.hide();
	};

	localPlayer.resetPlayer = function() {
		localPlayer.setYTPlayer(ytPlayer);
		ytPlayer.show();
	};

	function LocalPlayer(id) {
		var self = this;
		//TODO debug only (remove self.player)
		var player = localPlayer.player = $(id)[0];
		var events = new slothyx.util.EventHelper(self);

		self.load = function(id) {
			player.loadVideoById(id);
		};
		self.pause = function() {
			player.pauseVideo();
		};
		self.play = function() {
			player.playVideo();
		};
		self.stop = function() {
			self.load("");
		};
		self.setProgress = function(percentage) {
			player.seekTo(player.getDuration() / 100 * percentage, true);
		};
		self.hide = function() {
			$(id).hide();
		};
		self.show = function() {
			$(id).show();
		};
		self.requestFullscreen = function() {
			var elem = player;
			if(elem.requestFullscreen) {
				elem.requestFullscreen();
			} else if(elem.msRequestFullscreen) {
				elem.msRequestFullscreen();
			} else if(elem.mozRequestFullScreen) {
				elem.mozRequestFullScreen();
			} else if(elem.webkitRequestFullscreen) {
				elem.webkitRequestFullscreen();
			}
		};
		localPayerOnStateChangeCallback = function(state) {
			events.throwEvent(state);
		};
		player.addEventListener("onStateChange", "slothyx.localPlayer.onLocalPlayerStateChange");
	}

	function PlayerProxy() {
		//TODO buffer commands
		var self = this;
		var events = new slothyx.util.EventHelper(self);
		var player = null;

		self.load = function(id) {
			if(player !== null) {
				player.load(id);
			}
		};
		self.pause = function() {
			if(player !== null) {
				player.pause();
			}
		};
		self.play = function() {
			if(player !== null) {
				player.play();
			}
		};
		self.stop = function() {
			if(player !== null) {
				player.stop();
			}
		};
		self.setProgress = function(percentage) {
			if(player !== null) {
				player.setProgress(percentage);
			}
		};
		self.setPlayer = function(newPlayer) {
			if(player !== null) {
				player.removeListener(onStateChange);
				player.stop();
			}
			player = newPlayer;
			player.addListener(onStateChange);
		};
		function onStateChange(newState) {
			events.throwEvent(newState);
		}
	}

})(jQuery, window, swfobject);

//needed in global scope
function onYouTubePlayerReady() {
	"use strict";
	window.slothyx.localPlayer.onYouTubePlayerReady();
}