var task = {

  start: function(issueId) {
    return this.assignMeAndStart(issueId);
  },

  assignMeAndStart: function(issueId) {
    var self = this;
    return storage.get()
      .then(function(data) {
        return $.ajax({
          type: "PUT",
          url: data.options.redmineRootUrl + "issues/" + issueId + ".json",
          // レスポンスは空で返ってくる
          dataType: "text",
          data: {
            "issue": {
              "status_id": data.options.doingStatusId,
              "assigned_to_id": data.options.userId
            },
            "key": data.options.apiAccessKey
          }
        });
      });
  }
}
