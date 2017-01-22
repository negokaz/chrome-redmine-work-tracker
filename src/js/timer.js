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

  _tickInterval: null,

  _timerData: null,

  _bihavior: null,

  _startInterval: function() {
    if (!this._tickInterval) {
      this._tickInterval = setInterval(function() {
        this._process({command: "tick"});
      }.bind(this), 1000);
    }
  },

  _stopInterval: function() {
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
  },

  _process: function(command) {

    var newTimerData =
      (this._behaviors[this._timerData.status][command.command] !== undefined)
        ? (this._behaviors[this._timerData.status][command.command].bind(this))(this._timerData, command)
        : (this._behaviors.unhandled[command.command].bind(this))(this._timerData, command);

    return newTimerData.then(function(timerData) {
      this._timerData = timerData;
      this._changeBehavior(timerData);
      return timerData;
    }.bind(this)).then(function() {
      return storage.set({ timer: this._timerData });
    }.bind(this)).then(function() {
      this._setBadge(this._timerData.spendMillisec);
    }.bind(this));
  },

  _changeBehavior: function(timerData) {
    this._bihavior = this._behaviors[timerData.status];
    if (timerData.status == this.status.running) {
      this._startInterval();
    } else {
      this._stopInterval();
    }
  },

  _timerBeforeModify: null,

  _behaviors: {

    noTask: {

      start: function(timerData, command) {
        timerData.issueId = command.issueId;
        timerData.status = this.status.running;
        timerData.spendMillisec = 0;
        timerData.latestTickTime = null;
        return $.Deferred().resolve(timerData);
      }
    },

    running: {

      start: function(timerData, command) {
        if (timerData.issueId == command.issueId) {
          // do nothing
          return $.Deferred().resolve(timerData);
        } else {
          // renew
          return this._process({ command: 'stop' }).then(function() {
            timerData.status = this.status.running;
            timerData.issueId = command.issueId;
            return timerData;
          }.bind(this));
        }
      },

      tick: function(timerData) {
        if (timerData.latestTickTime) {
          timerData.spendMillisec += (Date.now() - timerData.latestTickTime);
        } else {
          timerData.spendMillisec += 1000;
        }
        timerData.latestTickTime = Date.now();
        return $.Deferred().resolve(timerData);
      }
    },

    paused: {

      start: function(timerData, command) {
        if (timerData.issueId == command.issueId) {
          // resume
          timerData.status = this.status.running;
          return $.Deferred().resolve(timerData);
        } else {
          // renew
          return this._process({ command: "stop" }).then(function() {
            timerData.status = this.status.running;
            return timerData;
          }.bind(this));
        }
      }
    },

    stopped: {

      start: function(timerData, command) {
        timerData.status = this.status.running;
        timerData.spendMillisec = 0;
        timerData.latestTickTime = null;
        return $.Deferred().resolve(timerData);
      }
    },

    unhandled: {

      boot: function(timerData, command) {
        return $.Deferred().resolve(timerData);
      },

      start: function(timerData, command) {
        return $.Deferred().resolve(timerData);
      },

      tick: function(timerData) {
        return $.Deferred().resolve(timerData);
      },

      stop: function(timerData, command) {
        return this._postTimeToRedmine(timerData).then(function() {
          timerData.status = this.status.stopped;
          timerData.spendMillisec = 0;
          timerData.latestTickTime = null;
          return timerData;
        }.bind(this));
      },

      pause: function(timerData, command) {
        timerData.status = this.status.paused;
        timerData.latestTickTime = null;
        return $.Deferred().resolve(timerData);
      },

      resume: function(timerData) {
        timerData.status = this.status.running;
        return $.Deferred().resolve(timerData);
      },

      rewind: function(timerData, command) {
        _timerBeforeModify = this._deepCopyObj(timerData);
        var newSpendMillisec = timerData.spendMillisec - (new Date(0).setMinutes(command.minutes));
        timerData.status = this.status.stopped;
        timerData.spendMillisec = (newSpendMillisec > 0) ? newSpendMillisec : 0;
        timerData.latestTickTime = null;
        return $.Deferred().resolve(timerData);
      },

      reset: function(timerData, command) {
        _timerBeforeModify = this._deepCopyObj(timerData);
        timerData.status = this.status.stopped;
        timerData.spendMillisec = 0;
        timerData.latestTickTime = null;
        return $.Deferred().resolve(timerData);
      },

      revertReset: function(timerData, command) {
        timerData.status = this.status.stopped;
        timerData.issueId = _timerBeforeModify.issueId;
        timerData.spendMillisec = _timerBeforeModify.spendMillisec;
        timerData.latestTickTime = null;
        return $.Deferred().resolve(timerData);
      }
    }
  },

  boot: function() {
    return storage.get()
      .then(function(data) {
        // インストール直後の起動
        if (!data.timer) {
          return this._createTimerSchema()
            .then(function(data) {
              this._timerData = data.timer;
              this._changeBehavior(data.timer);
              this._process({ command: "boot" });
            });
        } else {
          // 2度目以降の起動
          this._timerData = data.timer;
          this._changeBehavior(data.timer);
          return this._process({ command: "boot" });
        }
      }.bind(this));
  },

  _createTimerSchema: function() {
    var self = this;
    return storage.set({
        'timer': {
          issueId: null,
          status: self.status.noTask,
          spendMillisec: 0,
          latestTickTime: 0
        }
      });
  },

  _deepCopyObj: function(data) {
    var copied = {};
    for (var prop in data) {
      copied[prop] = data[prop];
    }
    return copied;
  },

  start: function(issueId) {
    return this._process({ command: "start", issueId: issueId });
  },

  pause: function() {
    return this._process({ command: "pause" });
  },

  stop: function() {
    return this._process({ command: "stop" });
  },

  rewind: function(minutes) {
    return this._process({ command: "rewind", minutes: minutes });
  },

  reset: function() {
    return this._process({ command: "reset" });
  },

  resume: function() {
    return this._process({ command: "resume" });
  },

  revertReset: function() {
    return this._process({ command: "revertReset" });
  },

  _postTimeToRedmine: function(timerData) {
    return storage.get()
      .then(function(data) {
        // 経過時間が0の場合は記録しない
        if (timerData.spendMillisec == 0) { return new $.Deferred().resolve(); }
        // ミリ秒 を 時間(hour)に換算
        var hours = timerData.spendMillisec / (60 * 60 * 1000);

        return $.post(data.options.redmineRootUrl + "time_entries.json", {
          key: data.options.apiAccessKey,
          time_entry: {
            issue_id: timerData.issueId,
            hours: hours,
            comments: ""
          }
        });
      }.bind(this));
  },

  _setBadge: function(timeMillisec) {
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
