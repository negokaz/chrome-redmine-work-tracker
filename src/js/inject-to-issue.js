$(function() {
    'use strict';

    var issueId = pickIssueIdFromUrl(window.location.pathname);
    var $startTag = $('<a class="icon icon-test redmine-timer-start" style="padding-right: 3px;" href="javascript:void(0)">実施</a>');

    $startTag.insertBefore('#content > .contextual > a.icon.icon-edit');
    $('a.redmine-timer-start').on('click', function() {
      chrome.runtime.sendMessage(chrome.runtime.id, {method: "start-task", param: {issueId: issueId}}, function(response) {
        if (response.success) { location.reload(); }
      });
    });

    var $startButton = $('<input type="button" class="redmine-timer-start" style="margin-left: 5px;" value="送信 (時間計測)" />');
    var $submit = $('#issue-form > input[name=commit]');
    $startButton.insertAfter($submit);
    $startButton.on('click', function() {
        chrome.runtime.sendMessage({method: "start-timer", param: {issueId: issueId}}, function(response) {
          if (response.success) { $submit.click(); }
        });
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
