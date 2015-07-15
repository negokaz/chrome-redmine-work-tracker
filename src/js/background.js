var options = {};

chrome.storage.local.get(function(data) {
    options = data.options;
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (options && options.redmineRootUrl && changeInfo.status === "complete") {
      if (tab.url.match(new RegExp("^" + options.redmineRootUrl + "issues/[0-9]+"))) {
        chrome.tabs.executeScript(tabId, {file: 'js/jquery.js'});
        chrome.tabs.executeScript(tabId, {file: 'js/inject-to-issue.js'});
      } else if (tab.url.match(new RegExp("^" + options.redmineRootUrl + ".*agile/board"))) {
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

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch(request.method) {
      case 'start-task':
        task.start(request.param.issueId)
          .then(function() { return timer.start(request.param.issueId); })
          .fail(function() { console.log(arguments); })
          .done(function() { sendResponse({success: true}); });
        return true;
      case 'start-timer':
        timer.start(request.param.issueId)
          .fail(function() { console.log(arguments); })
          .done(function() { sendResponse({success: true}); });
        return true;
      case 'pause-timer':
        timer.pause()
          .fail(function() { console.log(arguments); });
        return;
      case 'resume-timer':
        timer.resume()
          .fail(function() { console.log(arguments); });
        return;
      case 'stop-timer':
        timer.stop()
          .fail(function() { console.log(arguments); });
        return;
    }
  }
);
