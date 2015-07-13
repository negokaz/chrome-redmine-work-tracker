var timer = {

  boot: function() {
    var self = this;
    storage.get()
    .then(function(data) {
      if (!data.timer) {
        return;
      }
      switch (data.timer.status) {
        case 'started':
          return self.onTimer(data.timer.issueId);
      }
    })
    .then(function() {
      self.setBadge();
    })
    .promise();
  },

  start: function(issueId) {
    var self = this;
    storage.get()
    .then(function(data) {
      if (!data.timer) {
        self.upnew(issueId);
      }
      if (data.timer.issueId == issueId) {
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

  upnew: function(issueId) {
    return this.onTimer(issueId)
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

  renew: function(issueId) {
    var self = this;
    return this.stop()
      .then(function() {
        return self.upnew();
      })
      .promise();
  },

  onTimer: function(issueId) {
    var self = this;
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
        .then(function(data) {
          self.setBadge(data.timer.spendMillisec);
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
    var self = this;
    return storage.get()
      .then(function(data) {
        data.timer.status = 'paused';
        return data;
      })
      .then(storage.set)
      .then(function() {
        self.setBadge();
      })
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
    var self = this;
    return this.postTime()
      .then(storage.get)
      .then(function(data) {
        data.timer.status = 'stoped';
        data.timer.spendMillisec = 0;
        return data;
      })
      .then(storage.set)
      .then(function() {
        self.setBadge();
      })
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
  },

  setBadge: function(timeMillisec) {
    if (timeMillisec) {
      var date = new Date(timeMillisec);
      var formatedSpendTime =
        ('0' + date.getUTCHours()).slice(-2) + ":" + ('0' + date.getUTCMinutes()).slice(-2);
      chrome.browserAction.setBadgeText({text: formatedSpendTime});
    } else {
      chrome.browserAction.setBadgeText({text: ""});
    }
  }
};

timer.boot();
