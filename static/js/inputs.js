'use strict';

var version = "1.0.0";

var HomeInputHandler = function() { this.init(); }


HomeInputHandler.prototype.init = function(){
    this.chartSizes      = document.getElementsByClassName('chart-size');//document.getElementById('rad_size');
    this.selSingleSource = document.getElementById('sel_single-source');
    this.selMultiSource  = document.getElementById('sel_multi-source');
    this.txtStartTs      = document.getElementById('txt_startTs');
    this.txtEndTs        = document.getElementById('txt_endTs');
    this.btnApply        = document.getElementById('btn_apply');
       
    this.btnApply.addEventListener('click', this.apply.bind(this));// , capture?: boolean)

    this.inputChangeCallback = null;
}

HomeInputHandler.prototype.get_selected_options = function(domElem) {
    var selectedOptions = [];
    for (let domOption of domElem.selectedOptions)
        selectedOptions.push(domOption.value);
    return selectedOptions; 
}


HomeInputHandler.prototype.get_selected_radio = function(domElems) {
    for (let domRadio of domElems)
        if (domRadio.checked) return domRadio.value;

    return null; 
}


HomeInputHandler.prototype.apply = function()
{
    let size = this.get_selected_radio(this.chartSizes);
    let singleSource = this.selSingleSource.value;
    let multiSource = this.get_selected_options(this.selMultiSource);
    let startTs = this.txtStartTs.value;
    let endTs = this.txtEndTs.value;
    console.log(size, singleSource, multiSource, startTs, endTs);

    let data = {size:size, single: singleSource, multi: multiSource, start: startTs, end: endTs};
    if (this.inputChangeCallback) this.inputChangeCallback(data);
}

HomeInputHandler.prototype.defineCallBack = function(callback) {
    this.inputChangeCallback = callback;
}