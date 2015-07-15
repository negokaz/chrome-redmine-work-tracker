function loadOption() {
  chrome.storage.local.get(function(data) {
     if (data.options) {
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
          chrome.tabs.query({
            url: data.options.redmineRootUrl + 'issues/*'
          }, function (tabs) {
            $.each(tabs, function(i, tab) {
              if (tab.id == tabId) {
                chrome.tabs.executeScript(tabId, {file: 'js/jquery.js'});
                chrome.tabs.executeScript(tabId, {file: 'js/inject-to-issue.js'});
              }
            });
          });
        });
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
         chrome.tabs.query({
           url: data.options.redmineRootUrl + '*agile/board*'
         }, function (tabs) {
           $.each(tabs, function(i, tab) {
             if (tab.id == tabId) {
               chrome.tabs.executeScript(tabId, {file: 'js/jquery.js'});
               chrome.tabs.executeScript(tabId, {file: 'js/inject-to-agileboard.js'});
             }
           });
         });
       });
     }
  });
}
loadOption();

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch(request.method) {
      case 'load-option':
        loadOption();
        break;
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
