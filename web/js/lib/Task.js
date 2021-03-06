/**
 * Class Task
 * @license http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
 * @link http://github.com/kizi/easyminer-miningui
 *
 * @type Class
 */
var Task = new Class({
    GetterSetter: ['requestData', 'time'],

    $requestData: null,
    $time: null,
    $hasId: false,

    initialize: function(serializedRule, limitHits, debug, strictMatch, taskMode, cache) {
        var taskName = "";
        var articleId;

        // Create the task name
        if (serializedRule !== undefined &&
            serializedRule.IMs !== undefined) {

            serializedRule.antecedent.children.each(function (e) {
                taskName += e.name;
                if (e.category === 'One category') {
                    /*if (this.category.contains('<') || this.category.contains('>')) {
                        string += '<span class="coefficient">' + this.category + '</span>';
                    } else {
                        string += '<span class="coefficient">(' + this.category + ')</span>';
                    }*/
                    taskName += '(' + e.fields[0].value + ')'; // TODO otestovat všechny možné typy atributů
                } else if (e.category == 'Subset' && e.fields[0].value == 1 && e.fields[1].value == 1) {
                    taskName += '(*)';
                } else {
                    taskName += '(*' + e.category + ' ' + e.fields[0].value + '-' + e.fields[1].value + ')';
                }
                taskName += ' '+ serializedRule.antecedent.connective.type +' ';
            });
            /*
                serializedRule.IMs.each(function (e) {
                taskName += e.name + "(" + e.threshold + "), ";
            });*/
            taskName = taskName.substring(0, taskName.length - serializedRule.antecedent.connective.type.length -2);
            taskName += ' => ';
            serializedRule.succedent.children.each(function (e) {
                taskName += e.name;
                if (e.category === 'One category') {
                    /*if (this.category.contains('<') || this.category.contains('>')) {
                     string += '<span class="coefficient">' + this.category + '</span>';
                     } else {
                     string += '<span class="coefficient">(' + this.category + ')</span>';
                     }*/
                    taskName += '(' + e.fields[0].value + ')'; // TODO otestovat všechny možné typy atributů
                } else if (e.category == 'Subset' && e.fields[0].value == 1 && e.fields[1].value == 1) {
                    taskName += '(*)';
                } else {
                    taskName += '(*' + e.category + ' ' + e.fields[0].value + '-' + e.fields[1].value + ')';
                }
                taskName += ' '+ serializedRule.succedent.connective.type +' ';
            });
            taskName = taskName.substring(0, taskName.length - serializedRule.succedent.connective.type.length -2);
        }

        this.$requestData = {
            limitHits: limitHits,
            rule0: serializedRule,
            rules: 1,
            debug: debug,
            strict: strictMatch,
            taskMode: taskMode,
            taskName: taskName,
            articleId: articleId
        };

        this.$requestData.taskId = 0;

        this.$time = new Date();
    },

    parseFromObject: function(data) {
        this.$requestData = data.$requestData;
    },

    getId: function() {
        return this.$requestData.taskId;
    },

    /**
     * Sets short ID of task if was UUID first
     * @param int
     */
    setId: function(value) {
        this.$hasId = true;
        this.$requestData.taskId = value;
    },

    /**
     * Gets status of task, if has final ID
     * @returns {boolean}
     */
    getHasId: function() {
        return this.$hasId;
    },

    getDebug: function() {
        return this.$requestData.debug;
    },

    getTaskMode: function() {
        return this.$requestData.taskMode;
    },

    getCssId: function() {
        return 'task-' + this.$requestData.taskId;
    },

    getName: function() {
        return this.$requestData.taskName;
    },

    setName: function(value) {
        this.$requestData.taskName = value;
    },

    getChangeNameCssId: function() {
        return 'rename-task-' + this.$requestData.taskId;
    },

    /**
     * Gets the Sewebar Article ID.
     * @returns int Article ID.
     */
    getArticleId: function() {
        return this.$requestData.articleId;
    },

    /**
     * Sets the Sewebar Article ID.
     * @param int The Sewebar Article ID.
     */
    setArticleId: function(value) {
        this.$requestData.articleId = value;
    }
});