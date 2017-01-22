$(function() {
  'use strict';

  function enableWorkReminder() {

    var $reminderTag = $("#__redmine_timetracker_reminder");
    if ($reminderTag.length == 0) {
      $reminderTag = $("<span id='__redmine_timetracker_reminder' style='width:100%;height:1.8em;text-align:center;padding-top:2px;background:red;color:white;position:fixed;top:0;'>実施中のタスクがありません</span>").hide();
      $reminderTag.appendTo('body');
    }
    var $marginTag = $("#__redmine_timetracker_reminder_margin");
    if($marginTag.length == 0) {
      $marginTag = $("<div id='__redmine_timetracker_reminder_margin' style='height:1.8em;'></div>").hide();
      $marginTag.insertBefore("#top-menu");
    }

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
