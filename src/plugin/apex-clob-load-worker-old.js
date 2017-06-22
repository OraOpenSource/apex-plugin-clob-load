var queryString = '';

function addParam(name, val) {
   if (queryString === '') {
      queryString = name + '=' + ((val != null) ? encodeURIComponent(val)  : '');
   } else {
      queryString = queryString + '&'+ name + '=' + ((val != null) ? encodeURIComponent(val)  : '' );
   }
}

function chunkClob(clob, size) {
   var loopCount = Math.floor(clob.length / size) + 1;

   for (var i = 0; i < loopCount; i++) {
      addParam('f01', clob.slice(size * i,size*(i+1)));
   }
}

/**
   The following ajax library was taken from miniajax
   https://code.google.com/p/miniajax/
 */

function $(e){if(typeof e=='string')e=document.getElementById(e);return e};
function collect(a,f){var n=[];for(var i=0;i<a.length;i++){var v=f(a[i]);if(v!=null)n.push(v)}return n};

ajax={};
ajax.x=function(){try{return new ActiveXObject('Msxml2.XMLHTTP')}catch(e){try{return new ActiveXObject('Microsoft.XMLHTTP')}catch(e){return new XMLHttpRequest()}}};
ajax.serialize=function(f){var g=function(n){return f.getElementsByTagName(n)};var nv=function(e){if(e.name)return encodeURIComponent(e.name)+'='+encodeURIComponent(e.value);else return ''};var i=collect(g('input'),function(i){if((i.type!='radio'&&i.type!='checkbox')||i.checked)return nv(i)});var s=collect(g('select'),nv);var t=collect(g('textarea'),nv);return i.concat(s).concat(t).join('&');};
ajax.send=function(u,f,m,a){var x=ajax.x();x.open(m,u,true);x.onreadystatechange=function(){if(x.readyState==4)f(x.responseText)};if(m=='POST')x.setRequestHeader('Content-type','application/x-www-form-urlencoded');x.send(a)};
ajax.get=function(url,func){ajax.send(url,func,'GET')};
ajax.gets=function(url){var x=ajax.x();x.open('GET',url,false);x.send(null);return x.responseText};
ajax.post=function(url,func,args){ajax.send(url,func,'POST',args)};
ajax.update=function(url,elm){var e=$(elm);var f=function(r){e.innerHTML=r};ajax.get(url,f)};
ajax.submit=function(url,elm,frm){var e=$(elm);var f=function(r){e.innerHTML=r};ajax.post(url,f,ajax.serialize(frm))};

addEventListener('message', function(e) {
   var worker = this,
      data = e.data;

   if (data.x01 === 'SUBMIT_CLOB') {
      addParam('p_flow_id', data.p_flow_id);
      addParam('p_flow_step_id', data.p_flow_step_id);
      addParam('p_instance', data.p_instance);
      addParam('p_request', data.p_request);
      addParam('x01', data.x01);

      chunkClob(data.clobData, 30000);

      ajax.post(
         data.path + 'wwv_flow.show',
         function(data){
            worker.postMessage('success');
         },
         queryString
      );
   } else { //must be RENDER_CLOB
      addParam('p_flow_id', data.p_flow_id);
      addParam('p_flow_step_id', data.p_flow_step_id);
      addParam('p_instance', data.p_instance);
      addParam('p_request', data.p_request);
      addParam('x01', data.x01);

      ajax.post(
         data.path + 'wwv_flow.show',
         function(data){
            var retval = {};

            retval.clob = data;

            worker.postMessage(retval);
         },
         queryString
      );
   }

}, false);

