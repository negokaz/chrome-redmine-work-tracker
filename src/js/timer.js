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

  _startRemainingMillisecInterval: function() {
    setInterval(function() {
      this._updateRemainingMillisec(this._timerData);
    }.bind(this), 60000);
  },

  _timerData: null,

  _trackingIssue: null,

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
      this._setBadge(this._timerData);
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
          return this._process({ command: 'stop' }).then(function(timerData) {
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
          return this._process({ command: "stop" }).then(function(timerData) {
            timerData.issueId = command.issueId;
            timerData.status = this.status.running;
            return timerData;
          }.bind(this));
        }
      }
    },

    stopped: {

      start: function(timerData, command) {
        timerData.issueId = command.issueId;
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
    this._startRemainingMillisecInterval();
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
      }.bind(this)).then(function() {
        return this._updateRemainingMillisec(this._timerData);
      }.bind(this));
  },

  _createTimerSchema: function() {
    var self = this;
    return storage.set({
        'timer': {
          issueId: null,
          status: self.status.noTask,
          spendMillisec: 0,
          latestTickTime: 0,
          remainingMillisec: null
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
    return this._process({ command: "start", issueId: issueId }).then(function() {
      return this._updateRemainingMillisec(this._timerData);
    }.bind(this));
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

  _updateRemainingMillisec: function(timerData) {
    if (!timerData.issueId) {
      // do nothing
      return $.Deferred().resolve();
    }
    return storage.get()
      .then(function(data) {
        if (data.options.countdown) {
          return $.getJSON(data.options.redmineRootUrl + "issues/" + timerData.issueId + ".json", {
            key: data.options.apiAccessKey
          }).then(function(response) {
            if (response.issue && response.issue.estimated_hours && response.issue.spent_hours) {
              timerData.remainingMillisec = (response.issue.estimated_hours - response.issue.spent_hours) * 60 * 60 * 1000;
            } else {
              timerData.remainingMillisec = null;
            }
            return timerData;
          }.bind(this));
        } else {
          timerData.remainingMillisec = null;
          return $.Deferred().resolve(timerData);
        }
      }.bind(this));
  },

  _setBadge: function(timerData) {
    var spendMillisec = timerData.spendMillisec;

    var formatedSpendTime = null;
    var colorR = 0;
    var colorG = 0;
    var colorB = 0;

    if (spendMillisec) {
      var date = null;
      if (timerData.remainingMillisec) {
        date = new Date(Math.abs(timerData.remainingMillisec - spendMillisec));
        var colorWeightPer = (timerData.remainingMillisec > 0 && timerData.remainingMillisec > spendMillisec)
          ? spendMillisec / timerData.remainingMillisec
          : 1.0;
        colorR = Math.floor(255 * colorWeightPer);
        colorG = Math.floor(255 * (1.0 - colorWeightPer));
        colorB = 0;
      } else {
        date = new Date(spendMillisec);
        colorR = 0;
        colorG = 0;
        colorB = 255;
      }
      formatedSpendTime =
        date.getUTCHours() + ":" + ('0' + date.getUTCMinutes()).slice(-2);
    }
    chrome.browserAction.setBadgeText({text: (formatedSpendTime ? formatedSpendTime : "")});
    chrome.browserAction.setBadgeBackgroundColor({color: [colorR, colorG, colorB, 255]});
  }
};

timer.boot();
