$(function() {
  'use strict';

  var $startTag = $('<a class="icon icon-test redmine-timer-start" style="float:right;color:#888;" href="javascript:void(0)">Do</a>');

  $startTag.appendTo('.issue-card > .fields > .info');

  $('a.redmine-timer-start').on('click', function() {
    var issueId = $(this).parents(".issue-card").attr("data-id");
    chrome.runtime.sendMessage({method: "start-task", param: {issueId: issueId}, function(response) {
      if (response.success) { location.reload(); }
    });
  });
});
