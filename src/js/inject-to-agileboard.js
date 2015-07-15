$(function() {
  'use strict';

  var $startTag = $('<p class="time-tracker" style="text-align:right;"><a class="icon icon-test redmine-timer-start" style="color:#888;" href="javascript:void(0)">Do</a></p>');

  $startTag.appendTo('.issue-card > .fields');

  $('a.redmine-timer-start').on('click', function() {
    var issueId = $(this).parents(".issue-card").attr("data-id");
    chrome.runtime.sendMessage({method: "start-task", param: {issueId: issueId}}, function(response) {
      if (response.success) { location.reload(); }
    });
  });
});
