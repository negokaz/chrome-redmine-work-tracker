if (!window.hasRedmineTimeTracker) {
  // なぜか2回呼ばれる場合があるので、重複してロードしないようにする
  window.hasRedmineTimeTracker = true;

  $(function() {
    'use strict';

    var issueId = pickIssueIdFromUrl(window.location.pathname);
    var $startTag = $('<a class="icon icon-time redmine-timer-start" href="' + window.location.pathname + '">時間を計測</a>');

    $startTag.insertAfter('#content > .contextual > a.icon.icon-edit');
    $('a.redmine-timer-start').on('click', function() {
      chrome.runtime.sendMessage({method: "start-timer", param: {issueId: issueId}});
    });
  });

  function pickIssueIdFromUrl(url) {
    var regex = new RegExp("issues\/([0-9]+)\/?");
    if (regex.test(url)) {
      return regex.exec(url)[1];
    } else {
      return null;
    }
  }
}
