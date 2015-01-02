/*globals jQuery, window, YT, ko, _*/
(function($, window, undefined) {
	"use strict";

	/***** CONSTANTS *****/
	var VIDEO_TEXTFIELD_SELECTOR = '#newVideoId';
	var PLAYLIST_CODE_SELECTOR = '#newPlaylistCode';
	var PROGRESS_SLIDER_SELECTOR = '#progressSlider';
	var DEFAULT_WINDOW_TITLE = "Slothyx Music";

	var STATE_STOPPED = 0;
	var STATE_PLAYING = 1;
	var STATE_PAUSE = 2;
	var YT_STATE_STOPPED = 0;
	var YT_STATE_PLAYING = 1;
	var YT_STATE_PAUSE = 2;


	var slothyx = window.slothyx || {};
	window.slothyx = slothyx;


	function addPlaylist() {
		getPlayList().addPlaylist();
	}

	function deletePlaylist() {
		getPlayList().deleteCurrentPlaylist();
	}

	function generatePlaylistCode() {
		$(PLAYLIST_CODE_SELECTOR).val(_.reduce(getPlayList().getCurrentPlaylist().videos, function(code, video) {
			return code + video.id;
		}, ""));
		$(PLAYLIST_CODE_SELECTOR).get(0).select();
	}

	function renameCurrentPlaylist() {
		getPlayList().renameCurrentPlaylist();
	}

	function openRemotePlayer() {
		slothyx.remotePlayer.initActivePlayer();
	}

	function requestFullscreen () {
		slothyx.localPlayer.requestFullscreen();
	}

	function toggle() {
		if(stateModel.internalState() === STATE_PLAYING) {
			pause();
		} else {
			play();
		}
	}

	function play() {
		if(stateModel.internalState() === STATE_STOPPED) {
			getPlayList().selectNext();
		} else {
			stateModel.internalState(STATE_PLAYING);
			getYtPlayer().play();
		}
	}

	function pause() {
		stateModel.internalState(STATE_PAUSE);
		getYtPlayer().pause();
	}

	function stop() {
		//TODO check if needed
		stateModel.internalState(STATE_STOPPED);
		getYtPlayer().stop();
	}

	function getYtPlayer() {
		return slothyx.localPlayer.getPlayer();
	}

	function getPlayList() {
		return slothyx.lists.getPlaylist();
	}

	function getSearchResultList() {
		return slothyx.youtube.getSearchResultList();
	}

	function onSelectedVideo(video) {
		if(video !== null) {
			stateModel.internalState(STATE_PLAYING);
			getYtPlayer().load(video.id);
			setWindowTitle(video.title);
			$(PROGRESS_SLIDER_SELECTOR).slider('enable');
		} else {
			// TODO check "replay"
			stateModel.internalState(STATE_STOPPED);
			getYtPlayer().stop();
			setWindowTitle(DEFAULT_WINDOW_TITLE);
			$(PROGRESS_SLIDER_SELECTOR).slider('disable');
		}
	}

	function setWindowTitle(title) {
		window.document.title = title;
	}

	function onSpaceKey(event) {
		if(event.target.tagName !== "INPUT" && event.target.tagName !== "BUTTON") {
			toggle();
			return false;
		} else {
			return true;
		}
	}

	function loadVideoFromTextField() {
		//TODO move to youtube? do we need to know / should we know how to parse this?
		var callback = function(result) {
			_.forEach(result.videos, function(video) {
				getPlayList().addVideo(video);
			});
			$(VIDEO_TEXTFIELD_SELECTOR).val("");
		};
		var text = $(VIDEO_TEXTFIELD_SELECTOR).val();
		var regexResult = /v=([A-Za-z0-9_-]{11})/.exec(text);
		if(regexResult !== null) {
			slothyx.youtube.loadVideoData([regexResult[1]], callback);
		} else {
			if(text.length % 11 === 0) {
				var videoIds = [];
				for(var i = 0; i <= text.length; i += 11) {
					videoIds.push(text.substring(i, i + 11));
				}
				slothyx.youtube.loadVideoData(videoIds, callback);
			}
		}
	}

	var stateModel = {
		internalState: ko.observable(YT_STATE_STOPPED)
	};
	stateModel.playing = ko.pureComputed(function() {
		return stateModel.internalState() === YT_STATE_PLAYING;
	});

	function onYTPlayerStateChange(state) {
		switch(state) {
			case YT_STATE_STOPPED:
				getPlayList().selectNext();
				break;
			case YT_STATE_PLAYING:
				stateModel.internalState(STATE_PLAYING);
				break;
			case YT_STATE_PAUSE:
				stateModel.internalState(STATE_PAUSE);
				break;
		}
	}

	var progressSliderDragging = false;

	function onProgressChanged(progress) {
		//TODO integrate with knockout
		if(!progressSliderDragging) {
			$(PROGRESS_SLIDER_SELECTOR).slider("value", progress);
		}
	}

	function onSearchResultSelected(video) {
		getPlayList().addVideo(video);
	}

	function getModel() {
		return slothyx.knockout.getModel();
	}

	/*****INIT*****/
	getPlayList().addVideoSelectedListener(onSelectedVideo);
	getSearchResultList().addSearchResultSelectedListener(onSearchResultSelected);
	getYtPlayer().addListener(onYTPlayerStateChange);
	getModel().contribute({
		stateModel: stateModel,
		playlistOptions: {
			items: [
				{content: "Generate playlistcode", action: generatePlaylistCode},
				{content: "Rename current playlist", action: renameCurrentPlaylist},
				{content: "Delete current playlist", action: deletePlaylist},
				{content: "Open remote player", action: openRemotePlayer}
			]
		},
		toggle: toggle,
		onSpaceKey: onSpaceKey,
		loadVideoFromTextField: loadVideoFromTextField,
		progressSlider: {
			disabled: true,
			start: function() {
				progressSliderDragging = true;
			},
			stop: function(event, ui) {
				progressSliderDragging = false;
				getYtPlayer().setProgress(ui.value);
			}
		},
		volumeSlider: {
			orientation: "horizontal",
			value: 100,
			slide: function(event, ui) {
				getYtPlayer().setVolume(ui.value);
			}
		},
		addPlaylist: addPlaylist,
		requestFullscreen: requestFullscreen,
		generatePlaylistCode: generatePlaylistCode
	});

	slothyx.util.onStartUp(function() {
		getYtPlayer().addProgressListener(onProgressChanged);
	});

})(jQuery, window);

