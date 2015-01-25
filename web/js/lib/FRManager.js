var FRManager = new Class({

  config: null,
  FL: null,
  settings: null,
  i18n: null,
  AJAXBalancer: null,
  UIPainter: null,
  UIListener: null,
  errorMessage: '',

  //nově používané proměnné s informacemi o stavu
  task: null,
  miningInProgress: false,
  pageLoading:false,

  IMs: [],
  rules: [],

  rulesCount: 0,
  rulesOrder: null,
  rulesPerPage: null,
  currentPage: null,
  pagesCount: 0,


  initialize: function (config, FL, settings, UIPainter, UIListener, i18n) {
    this.config = config;
    var perPageOptions=this.getPerPageOptions();
    this.rulesPerPage=perPageOptions[0];

    this.FL = FL;
    this.settings = settings;
    this.UIPainter = UIPainter;
    this.UIListener = UIListener;
    this.i18n = i18n;
    this.AJAXBalancer = new AJAXBalancer();
  },

  handleInProgress: function () {
    this.reset();
    this.miningInProgress = true;
    this.UIPainter.renderActiveRule();
    this.UIPainter.renderFoundRules();
  },

  handleStoppedMining: function () {
    this.miningInProgress = false;
    this.UIPainter.renderActiveRule();
    this.UIPainter.renderFoundRules();
  },

  gotoPage: function(page){
    this.pageLoading=true;
    this.UIPainter.renderFoundRules();
    var url = this.config.getGetRulesUrl(this.task.getId(), (page - 1) * this.rulesPerPage, this.rulesPerPage, this.rulesOrder);

    //region načtení pravidel ze serveru...
    new Request.JSON({
      url: url,
      secure: true,
      onSuccess: function (responseJSON, responseText) {
        this.currentPage=page;
        this.handleSuccessRulesRequest(responseJSON);
      }.bind(this),

      onError: function () {
        this.handleErrorRulesRequest(page);
      }.bind(this),

      onFailure: function () {
        this.handleErrorRulesRequest(page);
      }.bind(this),

      onException: function () {
        this.handleErrorRulesRequest(page);
      }.bind(this),

      onTimeout: function () {
        this.handleErrorRulesRequest(page);
      }.bind(this)

    }).get();
    //endregion
  },

  handleSuccessRulesRequest: function (data) {
    //zjištění aktuálních měr zajímavosti
    this.pageLoading=false;
    this.IMs = this.FL.getRulesIMs(data.task.IMs);
    this.rules = [];

    Object.each(data.rules, function (value, key) {
      this.rules.push(new FoundRule(key, value, this.task));
    }.bind(this));

    this.UIPainter.renderFoundRules();
  },

  handleErrorRulesRequest: function (page){
    this.pageLoading=false;
    this.errorMessage=this.i18n.translate('Loading of rules failed...');
    this.UIPainter.renderFoundRules();
  },

  setRulesCount: function(rulesCount){
    this.rulesCount = rulesCount;
    this.calculatePagesCount();
    if (this.rulesCount > 0) {
      this.gotoPage(1);
    }
  },

  renderRules: function (rulesCount, taskName, inProgress, task) {
    console.log([rulesCount, taskName, inProgress, task]);
    this.task = task;
    this.miningInProgress = inProgress;
    if (taskName!=''){
      this.setTaskName(taskName);
    }
    this.setRulesCount(rulesCount);
    this.UIPainter.renderActiveRule();
    this.UIPainter.renderFoundRules();
  },

  buildFoundRulesRequest: function (foundRules, URL) {
    var options = {
      url: URL,
      secure: true,

      onRequest: function () {
        Array.each(foundRules,function(foundRule){
          foundRule.setLoading(true);
          this.UIPainter.updateFoundRule(foundRule);
        }.bind(this));
      }.bind(this),

      onSuccess: function (responseJSON, responseText) {
        this.handleSuccessFoundRulesRequest(responseJSON,foundRules);
      }.bind(this),

      onError: function () {
        this.handleErrorFoundRulesRequest(foundRules);
      }.bind(this),

      onCancel: function () {
        Array.each(foundRules,function(foundRule){
          foundRule.setLoading(false);
          this.UIPainter.updateFoundRule(foundRule);
        }.bind(this));
      }.bind(this),

      onFailure: function () {
        this.handleErrorFoundRulesRequest(foundRules);
      }.bind(this),

      onException: function () {
        this.handleErrorFoundRulesRequest(foundRules);
      }.bind(this),

      onTimeout: function () {
        this.handleErrorFoundRulesRequest(foundRules);
      }.bind(this)
    };
    var reqData=null;
    if(foundRules.length==1){
      this.AJAXBalancer.addRequest(options, JSON.encode(reqData), foundRules[0].getId());
    }else{
      this.AJAXBalancer.addRequest(options, JSON.encode(reqData));
    }
  },

  handleErrorFoundRulesRequest: function (foundRules) {
    if (foundRules.length>0){
      Array.each(foundRules,function(foundRule){
        foundRule.setLoading(false);
        this.UIPainter.updateFoundRule(foundRule);
      }.bind(this));
    }
  },



  handleSuccessFoundRulesRequest: function (jsonData,foundRules){
    if ((foundRules == undefined)||(foundRules.length==0)){return;}

    Array.each(foundRules,function(foundRule){
      if (jsonData.rules[foundRule.$id]){
        foundRule.initialize(foundRule.$id,jsonData.rules[foundRule.$id],this.task);
      }
      foundRule.setLoading(false);
      this.UIPainter.updateFoundRule(foundRule);
    }.bind(this));

  },


  handleError: function () {
    this.miningInProgress = false;
    this.UIPainter.renderActiveRule();
    this.UIPainter.renderFoundRules();
  },

  reset: function () {
    this.AJAXBalancer.stopAllRequests();
    this.errorMessage='';
    this.setRulesCount(0);
    this.IMs = this.FL.getRulesIMs([]);
    this.miningInProgress = false;
  },

  markFoundRule: function (foundRule) {
    this.AJAXBalancer.stopRequest(foundRule.getId());
    this.buildFoundRulesRequest([foundRule],this.config.getRuleClipboardAddRuleUrl(this.getTaskId(),foundRule.$id));
    this.AJAXBalancer.run();
  },

  unmarkFoundRule: function (foundRule) {
    this.AJAXBalancer.stopRequest(foundRule.getId());
    this.buildFoundRulesRequest([foundRule],this.config.getRuleClipboardRemoveRuleUrl(this.getTaskId(),foundRule.$id));
    this.AJAXBalancer.run();
  },

  cleanFoundRulesIds: function(foundRulesCSSIDs){
    var result=[];
    if (!(foundRulesCSSIDs.length>0)){
      return result;
    }
    var taskId=this.getTaskId();
    Array.each(foundRulesCSSIDs,function(id){
      var regExp=/^found-rule-(.+)-(\d+)-checkbox$/;
      var idArr=id.split('-');
      if(regExp.test(id)){
        if(taskId!=idArr[2]){
          return;
        }
        result.push(idArr[3]);
      }
    }.bind([taskId,result]));
    return result;
  },

  getFoundRulesByIds: function(foundRulesIds){
    var result=[];
    if (this.rules.length>0){
      Array.each(this.rules,function(rule){
        if (foundRulesIds.indexOf(rule.$id)>-1){
          result.push(rule);
        }
      }.bind([foundRulesIds,result]));
    }
    return result;
  },

  multiMarkFoundRules:function(foundRulesIds){
    var selectedFoundRules=this.getFoundRulesByIds(this.cleanFoundRulesIds(foundRulesIds));
    if (selectedFoundRules.length==0){return;}
    var urlIds=[];
    Array.each(selectedFoundRules,function(foundRule){
      urlIds.push(foundRule.$id);
      this.AJAXBalancer.stopRequest(foundRule.getId());
      foundRule.setLoading(true);
    }.bind(this));
    urlIds=urlIds.join(',');
    this.buildFoundRulesRequest(selectedFoundRules,this.config.getRuleClipboardAddRuleUrl(this.getTaskId(),urlIds));
    this.AJAXBalancer.run();
  },

  markAllFoundRules: function(){
    this.AJAXBalancer.stopAllRequests();
    var urlIds=[];
    Array.each(this.rules,function(foundRule){
      urlIds.push(foundRule.$id);
      foundRule.setLoading(true);
    }.bind(this));
    this.buildFoundRulesRequest(this.rules,this.config.getRuleClipboardAddAllRulesUrl(this.getTaskId(),urlIds));
    this.AJAXBalancer.run();
  },

  multiUnmarkFoundRules:function(foundRulesIds){
    var selectedFoundRules=this.getFoundRulesByIds(this.cleanFoundRulesIds(foundRulesIds));
    if (selectedFoundRules.length==0){return;}
    var urlIds=[];
    Array.each(selectedFoundRules,function(foundRule){
      urlIds.push(foundRule.$id);
      this.AJAXBalancer.stopRequest(foundRule.getId());
      foundRule.setLoading(true);
    }.bind(this));
    urlIds=urlIds.join(',');
    this.buildFoundRulesRequest(selectedFoundRules,this.config.getRuleClipboardRemoveRuleUrl(this.getTaskId(),urlIds));
    this.AJAXBalancer.run();
  },

  /**
   * Renames the task.
   * @param taskId Task id to rename.
   * @param newTaskName A new task name to set.
   */
  renameTask: function (taskId, newTaskName) {

    new Request.JSON({
      url: this.config.getTaskRenameUrl(taskId,newTaskName),
      secure: true,
      onSuccess: function () {
        this.handleRenameTaskFinished(taskId);
      }.bind(this),

      onError: function () {
        this.handleRenameTaskFinished(taskId);
      }.bind(this),

      onFailure: function () {
        this.handleRenameTaskFinished(taskId);
      }.bind(this),

      onException: function () {
        this.handleRenameTaskFinished(taskId);
      }.bind(this),

      onTimeout: function () {
        this.handleRenameTaskFinished(taskId);
      }.bind(this)
    }).get();

  },

  handleRenameTaskFinished: function(taskId){
    if (this.getTaskId()==taskId){
      //pokud jde o přejmenování aktuální úlohy, musíme ji překreslit (znovu načteme aktuální stránku s pravidly)
      this.gotoPage(this.currentPage);
    }
  },

  getPerPageOptions: function(){
    return this.config.getPerPageOptions();
  },

  getPaginatorType: function(){
    return this.config.getPaginatorType();
  },

  setRulesPerPage: function(count){
    this.rulesPerPage=count;
    this.calculatePagesCount();
    this.gotoPage(1);
  },

  calculatePagesCount: function(){
    this.pagesCount=Math.ceil(this.rulesCount/this.rulesPerPage);
  },

  setTaskName: function(name){
    this.task.setName(name);
  },

  getTaskName: function(){
    return this.task.getName();
  },

  getTaskId: function(){
    return this.task.getId();
  }

});