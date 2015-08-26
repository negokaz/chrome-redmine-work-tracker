var timer = {

  status: {
    /* タスクがなにもない状態(issueId が null になる) */
    noTask: "noTask",
    /* タイマーがカウントしている状態(時間エントリは未保存) */
    running: "running",
    /* 時間エントリが未保存で、タイマーが一時停止している状態 */
    paused: "paused",
    /* 時間エントリが保存済で、タイマーが停止している状態 */
    stopped: "stopped"
  },

  boot: function() {
    var self = this;
    return storage.get()
      .then(function(data) {
        // インストール直後の起動
        if (!data.timer) { return self.createTimerSchema(); }
        // 2度目以降の起動
        switch (data.timer.status) {
          // カウント中にバックグラウンドの処理が落ちたときなどは
          // タイマーを自動的に再開する
          case 'running':
            return self.onTimer(data.timer.issueId)
              .then(function() { self.setBadge(data.timer.spendMillisec); });
          default:
            return new $.Deferred().resolve();
        }
      })
      .promise();
  },

  createTimerSchema: function(issueId) {
    var self = this;
    return storage.set({
        'timer': {
          issueId: null,
          status: self.status.noTask,
          spendMillisec: 0
        }
      })
      .promise();
  },

  start: function(issueId) {
    var self = this;
    return storage.get()
      .then(function(data) {
        if (data.timer.issueId == issueId) {
          switch (data.timer.status) {
            case 'running':
              return new $.Deferred().resolve();
            case 'paused':
              return self.resume();
            case 'stopped':
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
    return storage.get()
      .then(function(data) {
        // まだ保存できていない場合は保存してから
        if (data.timer.status == self.status.running
            || data.timer.status == self.status.paused) {
          return self.stop();
        }
      })
      .then(storage.get)
      .then(function(data) {
        data.timer.issueId = issueId;
        data.timer.status = self.status.running;
        data.timer.spendMillisec = 0;
        return data;
      })
      .then(storage.set)
      .then(function(data) {
        return self.onTimer(data.timer.issueId);
      })
      .promise();
  },

  onTimer: function(issueId) {
    var self = this;
    var tickTimer = function() {
      return storage.get()
        .then(function(data) {
          // タイマーがカウントしている状態ではなくなった
          if (data.timer.issueId == issueId && data.timer.status != self.status.running) { return new $.Deferred().resolve(); }
          // タスクが変わった
          if (data.timer.issueId != issueId && data.timer.status == self.status.running) { return new $.Deferred().resolve(); }

          // タイマーを進める
          data.timer.spendMillisec += 1000;
          return storage.set(data)
            .then(function(data) {
              self.setBadge(data.timer.spendMillisec);
            })
            .then(function() {
              setTimeout(tickTimer, 1000);
            });
        });
    };
    return tickTimer().promise();
  },

  pause: function() {
    var self = this;
    return storage.get()
      .then(function(data) {
        data.timer.status = self.status.paused;
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
        data.timer.status = self.status.running;
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
    return self.postTime()
      .then(storage.get)
      .then(function(data) {
        data.timer.status = self.status.stopped;
        data.timer.spendMillisec = 0;
        return data;
      })
      .then(storage.set)
      .then(function() {
        self.setBadge();
      })
      .promise();
  },

  timerBeforeModify: null,

  rewind: function(minutes) {
    var self = this;
    return storage.get()
      .then(function(data) {
        timerBeforeModify = data.timer;
        var newSpendMinutes = data.timer.spendMillisec - (new Date(0).setMinutes(minutes));
        return storage.set({
          'timer': {
            issueId: data.timer.issueId,
            status: self.status.stopped,
            spendMillisec: (newSpendMinutes > 0) ? newSpendMinutes : 0
          }
        });
      })
      .then(function() {
        self.setBadge();
      })
      .promise();
  },

  reset: function() {
    var self = this;
    return storage.get()
      .then(function(data) {
        timerBeforeModify = data.timer;
        return storage.set({
          'timer': {
            issueId: data.timer.issueId,
            status: self.status.stopped,
            spendMillisec: 0
          }
        });
      })
      .then(function() {
        self.setBadge();
      })
      .promise();
  },

  revertReset: function() {
    var self = this;
    return storage.set({
        'timer': {
          issueId: timerBeforeModify.issueId,
          status: self.status.stopped,
          spendMillisec: timerBeforeModify.spendMillisec
        }
      })
      .then(function() {
        self.setBadge();
      })
      .promise();
  },

  postTime: function(onSuccess) {
    var self = this;
    return storage.get()
      .then(function(data) {
        // 経過時間が0の場合は記録しない
        if (data.timer.spendMillisec == 0) { return new $.Deferred().resolve(); }
        // ミリ秒 を 時間(hour)に換算
        var hours = data.timer.spendMillisec / (60 * 60 * 1000);

        return $.post(data.options.redmineRootUrl + "time_entries.json", {
          key: data.options.apiAccessKey,
          time_entry: {
            issue_id: data.timer.issueId,
            hours: hours,
            comments: ""
          }
        });
      })
      .promise();
  },

  setBadge: function(timeMillisec) {
    if (timeMillisec) {
      var date = new Date(timeMillisec);
      var formatedSpendTime =
        date.getUTCHours() + ":" + ('0' + date.getUTCMinutes()).slice(-2);
      chrome.browserAction.setBadgeText({text: formatedSpendTime});
    } else {
      chrome.browserAction.setBadgeText({text: ""});
    }
  }
};

timer.boot();
