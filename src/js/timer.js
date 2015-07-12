var timer = {

  restart: function() {
    var self = this;
    storage.get()
    .then(function(data) {
      if (!data.timer) {
        return;
      }
      chrome.browserAction.setBadgeText({text: "#" + data.timer.issueId});
      switch (data.timer.status) {
        case 'started':
          return self.onTimer(data.timer.issueId);
      }
    })
    .promise();
  },

  start: function(issueId) {
    var self = this;
    storage.get()
    .then(function(data) {
      if (data.timer && data.timer.issueId == issueId) {
        switch (data.timer.status) {
          case 'paused':
            return self.resume();
          default:
            return self.renew(issueId);
        }
      } else {
        return self.renew(issueId);
      }
    })
    .promise();
  },

  renew: function(issueId) {
    var self = this;
    return this.stop()
    .then(function(data) {
      chrome.browserAction.setBadgeText({text: "#" + issueId});
      return self.onTimer(data.timer.issueId);
    })
    .then(function() {
      return storage.set({
        'timer': {
          issueId: issueId,
          status: 'started',
          spendMillisec: 0
        }
      });
    })
    .promise();
  },

  onTimer: function(issueId) {
    var tickTimer = function() {
      return storage.get()
        .then(function(data) {
          if (data.timer.status != 'started'
              || (data.timer.status == 'started' && data.timer.issueId != issueId)) {
            return new $.Deferred().reject();
          }
          data.timer.spendMillisec += 1000;
          return storage.set(data);
        })
        .then(function() {
          setTimeout(tickTimer, 1000);
        }, function() {
          return new $.Deferred().resolve();
        });
    };
    return tickTimer().promise();
  },

  pause: function() {
    return storage.get()
      .then(function(data) {
        data.timer.status = 'paused';
        return data;
      })
      .then(storage.set)
      .promise();
  },

  resume: function() {
    var self = this;
    return storage.get()
      .then(function(data) {
        data.timer.status = 'started';
        return data;
      })
      .then(storage.set)
      .then(function(data) {
        return self.onTimer(data.timer.issueId);
      })
      .promise();
  },

  stop: function() {
    return this.postTime()
      .then(storage.get)
      .then(function(data) {
        data.timer.status = 'stoped';
        data.timer.spendMillisec = 0;
        return data;
      })
      .then(storage.set)
      .promise();
  },

  postTime: function(onSuccess) {
    var post = function(data) {
      return $.post(data.options.redmineRootUrl + "time_entries.json", {
        key: data.options.apiAccessKey,
        time_entry: {
          issue_id: data.timer.issueId,
          // ミリ秒 を 時間に換算
          hours: data.timer.spendMillisec / (60 * 60 * 1000),
          comments: ""
        }
      });
    }
    return storage.get().then(post).promise();
  }
};

timer.restart();
