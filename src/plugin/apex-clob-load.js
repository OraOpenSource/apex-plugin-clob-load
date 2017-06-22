;(function($){

'use strict';

$.widget('ui.apexClobLoad', {
   options:{
      showModal: null,
      dialogTitle: null,
      loadingImageSrc: null,
      ajaxIdentifier: null,
      apexThis: null,
      pluginFilePrefix: null
   },
   _create: function() {
      var uiw = this;

      uiw._createPrivateStorage();
      uiw._initElements();
   },
   _createPrivateStorage: function() {
      var uiw = this;

      uiw._values = {
         dialogCountData: 'clob_load_dialog_count'
      };

      uiw._elements = {
         $dialog: {}
      };
   },
   _initElements: function() {
      var uiw = this;

      uiw._elements.$dialog = $('div.clob-load-container');
   },
   _showSpinner: function() {
      var uiw = this;

      uiw._values.spinner = apex.util.showSpinner();
   },
   renderClob: function(opts) {
      var uiw = this,
         queryString,
         worker,
         workerFileName;

      if (opts.showSpinner === 'Y') {
         uiw._incDialogCount();

         if (uiw._getDialogCount() === 1){
            uiw._showSpinner();
         }
      }

      if (window.Worker) { //Web workers supported, move to background job
         workerFileName = 'apex-clob-load-worker.js';
         worker = new Worker(uiw.options.pluginFilePrefix + workerFileName);

         //Using native bindings as jQuery's causes problems with workers
         worker.addEventListener('message', function(e) {
            uiw._handleClobRenderSuccess(e.data.clob, opts);
         }, false);

         worker.postMessage({
            p_flow_id: $('#pFlowId').val(),
            p_flow_step_id: $('#pFlowStepId').val(),
            p_instance: $('#pInstance').val(),
            p_request: 'PLUGIN=' + opts.ajaxIdentifier,
            x01: 'RENDER_CLOB',
            path: window.location.pathname.slice(0, window.location.pathname.lastIndexOf('/') + 1)
         });
      } else {
         queryString = {
            p_flow_id: $('#pFlowId').val(),
            p_flow_step_id: $('#pFlowStepId').val(),
            p_instance: $('#pInstance').val(),
            p_request: 'PLUGIN=' + opts.ajaxIdentifier,
            x01: 'RENDER_CLOB'
         };

         $.ajax({
            type: 'POST',
            url: 'wwv_flow.show',
            data: queryString,
            dateType: 'text',
            async: true,
            context: this,
            success: function(data){
               uiw._handleClobRenderSuccess(data, opts);
            }
         });
      }
   },
   _handleClobRenderSuccess: function(data, opts) {
      var uiw = this;

      $s(opts.$elmt[0], data);
      $.data(opts.$elmt[0], 'defaultValue', data);

      if (opts.showSpinner === 'Y') {
         uiw._decDialogCount();
      }

      if (uiw._getDialogCount() === 0) {
         uiw._values.spinner.remove();

         $(document).trigger('apexclobloadrendercomplete');
      }
   },
   submitClob: function(opts){
      var uiw = this,
         elmt,
         clobData,
         defaultValue,
         queryString,
         worker;

      elmt = opts.$elmt[0];
      // CASE - when using rich text editor vs standard text area.
      if ($(elmt).hasClass("rich_text_editor")) {
         // rich text CK editor - determine mode
         if ($(elmt).parent().find("iframe").length) {
            // using the standard rich text editor
            clobData = $(elmt).parent().find("iframe").contents().find("body").html();
         } else {
            // using "source" editor
            // no iframe - but adds a text area (5.0.0 verified)
            clobData = $(elmt).parent().find("textarea").eq(1).val();
         }
      } else {
         // using standard TEXT AREA
         clobData = $(elmt).val();
      }

      defaultValue = $.data(elmt, 'defaultValue');
      $s(elmt, ''); //added due to trouble submitting page, look into catching errors and putting values back

      if (opts.changeOnly === 'N' || clobData !== defaultValue) {
         if (opts.showSpinner === 'Y') {
            uiw._incDialogCount();

            if (uiw._getDialogCount() === 1){
               uiw._showSpinner();
            }
         }

         if (opts.makeBlocking === 'Y') {
            queryString = {
               p_flow_id: $('#pFlowId').val(),
               p_flow_step_id: $('#pFlowStepId').val(),
               p_instance: $('#pInstance').val(),
               p_request: 'PLUGIN=' + opts.ajaxIdentifier,
               x01: 'SUBMIT_CLOB',
               f01: []
            };

            queryString = uiw._chunkClob(clobData, 30000,  queryString);

            $.ajax({
               type: 'POST',
               url: 'wwv_flow.show',
               data: queryString,
               dateType: 'text',
               async: false,
               context: this,
               success: function(data){
                  uiw._handleSubmitClobSuccess(opts);
               }
            });
         } else {
            if (window.Worker) { //Web workers supported, move to background job
               worker = new Worker(uiw.options.pluginFilePrefix + 'apex-clob-load-worker.js');

               //Using native bindings as jQuery's causes problems with workers
               worker.addEventListener('message', function(e) {
                  uiw._handleSubmitClobSuccess(opts);
               }, false);

               worker.postMessage({
                  p_flow_id: $('#pFlowId').val(),
                  p_flow_step_id: $('#pFlowStepId').val(),
                  p_instance: $('#pInstance').val(),
                  p_request: 'PLUGIN=' + opts.ajaxIdentifier,
                  x01: 'SUBMIT_CLOB',
                  clobData: clobData,
                  path: window.location.pathname.slice(0, window.location.pathname.lastIndexOf('/') + 1)
               });
            } else {
               queryString = {
                  p_flow_id: $('#pFlowId').val(),
                  p_flow_step_id: $('#pFlowStepId').val(),
                  p_instance: $('#pInstance').val(),
                  p_request: 'PLUGIN=' + opts.ajaxIdentifier,
                  x01: 'SUBMIT_CLOB',
                  f01: []
               };

               queryString = uiw._chunkClob(clobData, 30000,  queryString);

               $.ajax({
                  type: 'POST',
                  url: 'wwv_flow.show',
                  data: queryString,
                  dateType: 'text',
                  async: true,
                  context: this,
                  success: function(data){
                     uiw._handleSubmitClobSuccess(opts);
                  }
               });
            }
         }
      }
   },
   _handleSubmitClobSuccess: function(opts){
      var uiw = this;

      if (opts.showSpinner === 'Y') {
         uiw._decDialogCount();
      }

      if (uiw._getDialogCount() === 0) {
         uiw._values.spinner.remove();

         $(document).trigger('apexclobloadsubmitcomplete');
      }
   },
   _incDialogCount: function(){
      var uiw = this,
         count = uiw._getDialogCount();

      if (count === undefined || count < 0) {
         count = 1;
         uiw._setDialogCount(count);
      } else {
         count++;
         uiw._setDialogCount(count);
      }
   },
   _decDialogCount: function(){
      var uiw = this,
         count = uiw._getDialogCount();

      if (count >= 0) {
         count--;
         uiw._setDialogCount(count);
      }
   },
   _getDialogCount: function(){
      var uiw = this,
         count = $.data(document, uiw._values.dialogCountData);

      return (count === undefined || count < 0) ? 0 : count;
   },
   _setDialogCount: function(newCount){
      var uiw = this;

      $.data(document, uiw._values.dialogCountData, newCount);
   },
   _chunkClob: function(clob,size,queryString){
      var uiw = this,
         loopCount = Math.floor(clob.length / size) + 1;

      for (var i = 0; i < loopCount; i++) {
         queryString.f01.push(clob.slice(size * i,size*(i+1)));
      }

      return queryString;
   }
});
})(apex.jQuery);