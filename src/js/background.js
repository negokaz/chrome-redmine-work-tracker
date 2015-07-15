var options = {};

chrome.storage.local.get(function(data) {
    options = data.options;
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (options && options.redmineRootUrl && changeInfo.status === "complete" && tab.url.indexOf(options.redmineRootUrl + 'issues/') === 0) {
        chrome.tabs.executeScript(tabId, {file: 'js/jquery.js'});
        chrome.tabs.executeScript(tabId, {file: 'js/inject-to-redmine.js'});
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
      case 'start-timer':
        timer.start(request.param.issueId);
        break;
      case 'pause-timer':
        timer.pause();
        break;
      case 'resume-timer':
        timer.resume();
        break;
      case 'stop-timer':
        timer.stop();
        break;
    }
  }
);
