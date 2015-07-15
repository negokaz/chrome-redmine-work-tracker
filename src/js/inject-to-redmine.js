$(function() {
    'use strict';

    var issueId = pickIssueIdFromUrl(window.location.pathname);
    var $startTag = $('<a class="icon icon-time redmine-timer-start" href="' + window.location.pathname + '">時間を計測</a>');

    $startTag.insertAfter('#content > .contextual > a.icon.icon-edit');
    $('a.redmine-timer-start').on('click', function() {
        chrome.runtime.sendMessage({method: "start-timer", param: {issueId: issueId}});
    });

    var $startButton = $('<input type="button" class="redmine-timer-start" style="margin-left: 5px;" value="送信 (時間計測)" />');
    var $submit = $('#issue-form > input[name=commit]');
    $startButton.insertAfter($submit);
    $startButton.on('click', function() {
        chrome.runtime.sendMessage({method: "start-timer", param: {issueId: issueId}});
        $submit.click();
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
