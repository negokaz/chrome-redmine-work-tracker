chrome.runtime.onInstalled.addListener(function(details) {
  // オプションに設定されていない項目があればオプション画面を開く
  chrome.storage.local.get(function(data) {
    if (!data.options
        || !data.options.redmineRootUrl
        || !data.options.apiAccessKey
        || !data.options.userId
        || !data.options.doingStatusId
        || !data.options.workReminderEnabled) {

      chrome.tabs.create({
        "url": chrome.extension.getURL("view/options.html"),
      });
    }
  });
});

var options = {};

chrome.storage.local.get(function(data) {
    options = data.options;
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (options && options.redmineRootUrl && changeInfo.status === "complete") {
      if (tab.url.match(new RegExp("^" + options.redmineRootUrl + ".*"))) {
        chrome.tabs.executeScript(tabId, {file: 'js/jquery.js'});
        chrome.tabs.executeScript(tabId, {file: 'js/inject-to-redmine.js'});
      }
      if (tab.url.match(new RegExp("^" + options.redmineRootUrl + "issues/[0-9]+"))) {
        chrome.tabs.executeScript(tabId, {file: 'js/jquery.js'});
        chrome.tabs.executeScript(tabId, {file: 'js/inject-to-issue.js'});
      }
      if (tab.url.match(new RegExp("^" + options.redmineRootUrl + ".*agile/board"))) {
        chrome.tabs.executeScript(tabId, {file: 'js/jquery.js'});
        chrome.tabs.executeScript(tabId, {file: 'js/inject-to-agileboard.js'});
      }
    }
});

chrome.storage.onChanged.addListener(function (changeInfo, type){
    if (type === "local" && changeInfo.options) {
        options = changeInfo.options.newValue;
    }
});

function timerStateUpdated() {
  chrome.storage.local.get(function(data) {
    chrome.tabs.query({url: data.options.redmineRootUrl + "*" }, function(tabs) {
      $.each(tabs, function(i, tab) {
        chrome.tabs.sendMessage(tab.id, {method: "state-updated", data: data});
      });
    });
  });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch(request.method) {
      case 'start-task':
        task.start(request.param.issueId)
          .then(function() { return timer.start(request.param.issueId); })
          .fail(function() { console.log(arguments); })
          .done(function() { sendResponse({success: true}); timerStateUpdated(); });
        return true;
      case 'start-timer':
        timer.start(request.param.issueId)
          .fail(function() { console.log(arguments); })
          .done(function() { sendResponse({success: true}); timerStateUpdated(); });
        return true;
      case 'pause-timer':
        timer.pause()
          .fail(function() { console.log(arguments); })
          .done(function() { timerStateUpdated(); });
        return;
      case 'resume-timer':
        timer.resume()
          .fail(function() { console.log(arguments); })
          .done(function() { timerStateUpdated(); });
        return;
      case 'stop-timer':
        timer.stop()
          .fail(function() { console.log(arguments); })
          .done(function() { timerStateUpdated(); });
        return;
      case 'rewind-timer':
        timer.rewind(request.param.minutes)
          .fail(function() { console.log(arguments); })
          .done(function() { sendResponse({success: true}); timerStateUpdated(); });
        return true;
      case 'reset-timer':
        timer.reset()
          .fail(function() { console.log(arguments); })
          .done(function() { sendResponse({success: true}); timerStateUpdated(); });
        return true;
      case 'revert-reset-timer':
        timer.revertReset()
          .fail(function() { console.log(arguments); })
          .done(function() { sendResponse({success: true}); timerStateUpdated(); });
        return true;
    }
  }
);
