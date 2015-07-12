var storage = {

  get: function() {
    var d = new $.Deferred();
    chrome.storage.local.get(function(data) {
      if (data.runtime && data.runtime.lastError) {
        d.fail(data.runtime.lastError.message);
        return;
      }
      d.resolve(data);
    });
    return d.promise();
  },

  set: function(data) {
    var d = new $.Deferred();
    chrome.storage.local.set(data, function(error) {
      if (data.runtime && data.runtime.lastError) {
        d.fail(error.runtime.lastError);
        return;
      }
      d.resolve(data);
    });
    return d.promise();
  },

  remove: function(keys) {
    chrome.storage.local.remove(keys);
  }

};
