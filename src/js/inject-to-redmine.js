$(function() {
  'use strict';

  function enableWorkReminder() {
    // top-menuの前に追加してしまうと、↓スクロールしたときにヘッダに隠れてしまうのでbodyの最後に追加する
    var $reminderTag = $("<span style='width:100%;height:1.8em;text-align:center;padding-top:2px;background:red;color:white;position:fixed;top:0;'>Time tracker isn't running.</span>").hide();
    $reminderTag.appendTo('body');
    // top-menuが隠れてしまわないように
    var $marginTag = $("<div style='height:1.8em;'></div>").hide();
    $marginTag.insertBefore("#top-menu");

    function displayAlert() {
      $marginTag.show();
      $reminderTag.show();
    }

    function hideAlert() {
      $marginTag.hide();
      $reminderTag.hide();
    }

    chrome.storage.local.get(function(data) {
      if (data.timer.status != 'running') {
        displayAlert();
      }
    });

    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        switch(request.method) {
          case 'state-updated':
            if (request.data.timer.status == 'running') { hideAlert(); } else { displayAlert(); }
            break;
        }
    });
  }

  chrome.storage.local.get(function(data) {
    if (data.options.workReminderEnabled) {
      enableWorkReminder();
    }
  });

});
