var MarkedTask = new Class({

  // používané proměnné MarkedTask
  config: null,
  currentPage: 1,
  desc: null,
  errorMessage: '',
  i18n: null,
  id: null,
  isBase: false,
  isInit: false,
  IMs: [],
  FL: null,
  MRManager: null,
  name: null,
  pagesCount: 0,
  pageLoading:false,
  rules: {},
  rulesCount: 0,
  rulesOrder: 'DEFAULT',
  rulesPerPage: null,
  miningState: null,
  importState: null,
  UIPainter: null,

  initialize: function (id, name, config, count, i18n, FL, UIPainter, MRManager, isBase, rulesOrder, miningState, importState) {
    this.config = config;
    this.i18n = i18n;
    this.id = id;
    this.isBase = isBase;
    this.FL = FL;
    this.MRManager = MRManager;
    this.name = name;
    this.rulesCount = count;
    var perPageOptions = this.getPerPageOptions();
    this.rulesPerPage = perPageOptions[0];
    this.UIPainter = UIPainter;
    if(rulesOrder != ''){
      this.rulesOrder = rulesOrder;
    }
    this.miningState=miningState;
    this.importState=importState;
    //if(this.isBase){ this.gotoPage(1); }
  },

  calculatePagesCount: function(){
    var newPagesCount = Math.ceil(this.rulesCount/this.rulesPerPage);
    if(this.pagesCount != newPagesCount){
      if(this.currentPage > newPagesCount){
        this.gotoPage(newPagesCount); // go to the last page if we were out of range
        this.currentPage = newPagesCount;
      }
      this.pagesCount = newPagesCount;
    }
    this.UIPainter.renderMarkedTask(this);
  },

  getPaginatorType: function(){
    return this.config.getPaginatorType();
  },

  getPerPageOptions: function(){
    return this.config.getPerPageOptions();
  },

  gotoPage: function(page){
    //this.pageLoading = true;
    //this.UIPainter.renderMarkedRules(this);
    if(this.isBase){
      var url = this.config.getKnowledgeBaseGetRulesUrl(this.id, (page - 1) * this.rulesPerPage, this.rulesPerPage, this.rulesOrder);
    } else{
      this.isInit = true;
      var url = this.config.getRuleClipboardGetRulesUrl(this.id, (page - 1) * this.rulesPerPage, this.rulesPerPage, this.rulesOrder);
    }

    //region načtení pravidel ze serveru...
    new Request.JSON({
      url: url,
      secure: true,
      onSuccess: function (responseJSON, responseText) {
        this.currentPage = page;
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

  handleErrorRulesRequest: function (page){
    this.pageLoading = false;
    this.errorMessage=this.i18n.translate('Loading of tasks rules failed...');
    //this.UIPainter.renderFoundRules();
  },

  handleSuccessRulesRequest: function (data) {
    var type = (this.isBase) ? 'ruleset' : 'task';
    this.pageLoading = false;
    this.rules = {};
    if(data[type].rulesCount == 0 && !this.isBase) {
      this.MRManager.removeTask(this);
    } else{
      if(this.isBase){
        this.desc = data[type].description;
        this.UIPainter.renderActiveRuleset(data[type].name, data[type].rulesCount);
        if(data[type].rulesCount > 0){
          this.UIPainter.renderMarkedTask(this, 'minimize');
          this.MRManager.setTaskName(this.id, data[type].name);
          this.isInit = true;
          this.MRManager.KBManager.setRulesCount(data[type].rulesCount);
        }
      }
      this.IMs = this.FL.getRulesIMs(data[type].IMs);
      this.setRulesCount(data[type].rulesCount);
      if(this.pagesCount > 7){
        this.UIPainter.renderMarkedTask(this, 'minimize');
      }

      Object.each(data.rules, function (MRdata, MRid) {
        this.rules[MRid] = new MarkedRule(MRid, MRdata, this);
      }.bind(this));
      if(data[type].rulesCount > 0){
        this.UIPainter.renderMarkedRules(this);
        if(!this.isBase){
          //console.log("Hey");

          //console.log(Object.getLength(this.rules));
          this.MRManager.KBManager.basicAnalyze(this.rules, "marked");
        }
      }
    }
  },

  reload: function(){
    this.gotoPage(this.currentPage);
  },

  setDesc: function(desc){
    this.desc = desc;
  },

  setName: function(name){
    this.name = name;
  },

  setRulesCount: function(rulesCount){
    if(this.rulesCount != rulesCount){
      this.rulesCount = rulesCount;
      this.calculatePagesCount();
    }
  },

  setRulesPerPage: function(count){
    this.rulesPerPage = count;
    this.calculatePagesCount();
    this.gotoPage(1);
  },

  isMiningInProgress: function(){
    return !(this.miningState=='solved' || this.miningState=='interrupted' || this.miningState=='failed');
  },

  isImportInProgress: function(){
    return (this.importState=='waiting' || this.importState=='partial');
  }

});