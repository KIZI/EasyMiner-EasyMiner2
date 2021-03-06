/**
 * Class MiningManager
 * @license http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
 * @link http://github.com/kizi/easyminer-miningui
 *
 * @type Class
 */
var MiningManager = new Class({

  config: null,
  settings: null,
  FRManager: null,
  dateHelper: null,
  $taskManager: null,

  requests: [],
  inProgress: false,
  importState: null, //values: none, waiting, partial, done
  finishedStates: ['solved', 'interrupted', 'solved_heads'],
  errorStates: ['failed'],
  miningRequestDelay: 2500,
  importRequestDelay: 700,

  miningState: null,

  initialize: function (config, settings, FRManager, dateHelper, taskManager) {
    this.config = config;
    this.settings = settings;
    this.FRManager = FRManager;
    this.dateHelper = dateHelper;
    this.$taskManager = taskManager;
  },

  mineRules: function (rule, limitHits) {
    this.inProgress = true;
    this.miningState = null;
    this.FRManager.handleInProgress();
    this.$taskManager.addTask(rule.serialize(), limitHits);
    this.makeRequest(JSON.encode(this.$taskManager.getActiveTask().getRequestData()));
  },

  makeRequest: function (data) {
    var activeTask = this.$taskManager.getActiveTask();
    if (!activeTask) {
      return;
      /*TODO zobrazení info...*/
    }
    var request = new Request.JSON({
      url: this.config.getStartMiningUrl(activeTask.getId()),
      secure: true,

      onSuccess: function (responseJSON, responseText) {
        if (/*responseJSON.status === 'ok' && */!this.errorStates.contains(responseJSON.state)) {
          if(activeTask.getHasId() == false){
            activeTask.setId(responseJSON.taskId);
          }
          this.handleSuccessRequest(data, responseJSON);
        } else {
          this.handleErrorRequest();
        }
      }.bind(this),

      onError: function () {
        this.handleErrorRequest();
      }.bind(this),

      onFailure: function () {
        this.handleErrorRequest();
      }.bind(this),

      onException: function () {
        this.handleErrorRequest();
      }.bind(this),

      onTimeout: function () {
        this.handleErrorRequest();
      }.bind(this)

    }).post({'data': data});

    this.requests.push(request);
  },

  handleSuccessRequest: function (data, responseJSON) {
    if (!this.isInProgress() && !this.isImportInProgress()) {
      return;
    }

    var state = responseJSON.state;
    var rulesCount = responseJSON.rulesCount;
    var taskName = '';
    if (responseJSON.name != undefined && responseJSON.name!=''){
      taskName = responseJSON.name;
    }
    this.miningState = state;
    this.importState=responseJSON.importState;

    if (this.finishedStates.contains(state)) {
      // task is finished
      this.inProgress = false;
    }

    if (this.isInProgress() || this.isImportInProgress()){
      //task is still running, or results were not imported yet
      this.makeRequest.delay((this.isInProgress()?this.miningRequestDelay:this.importRequestDelay), this, data);
    }

    this.FRManager.renderRules(rulesCount, taskName, this.isInProgress(), this.isImportInProgress(), this.$taskManager.getActiveTask());
  },

  handleErrorRequest: function () {
    if (!this.inProgress) {
      return;
    }
    this.miningState = 'failed';
    this.stopMining();
    this.FRManager.handleError();
  },

  stopMining: function () {
    // stop all requests
    Array.each(this.requests, function (req) {
      if (req.isRunning()) {
        req.cancel();
      }
    });

    // stop remote LM mining
    if (this.inProgress) { // hack around req.cancel(); weird bug
      this.inProgress = false;
      this.miningState = 'interrupted';
      this.stopRemoteMining(this.config.getStopMiningUrl(this.$taskManager.getActiveTask().getId()), this.$taskManager.getActiveTask().getDebug(), this.$taskManager.getActiveTask().getTaskMode());
    }

    this.requests = [];
    this.$taskManager.clearActiveTask();
    this.FRManager.handleStoppedMining(this.miningState, this.importState);
  },

  isInProgress: function () {
    return this.inProgress;
  },

  isImportInProgress: function(){
    return (this.importState=='waiting' || this.importState=='partial');
  },

  getMiningState: function () {
    return this.miningState;
  },

  stopRemoteMining: function (url, debug, taskMode) {
    var data = JSON.encode({
      //taskId: taskId,
      debug: debug,
      //joomlaUrl: joomlaUrl,
      taskMode: taskMode
    });

    new Request.JSON({
      url: url,
      secure: true
    }).post({'data': data});
  }
});