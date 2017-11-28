'use strict';

var version = "1.0.0";

var HomeInputHandler = function() { this.init(); }


HomeInputHandler.prototype.init = function(){
    //this.chartSizes      = document.getElementsByClassName('chart-size');//document.getElementById('rad_size');
    //this.selSingleSource = document.getElementById('sel_single-source');
    //this.selMultiSource  = document.getElementById('sel_multi-source');
    this.cmbDrc         = document.getElementById('pq_drc');
    this.txtStartTs     = document.getElementById('pq_startTs');
    this.txtEndTs       = document.getElementById('pq_endTs');
    this.btnApply       = document.getElementById('pq_apply');
       
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
//    let size = this.get_selected_radio(this.chartSizes);
//    let singleSource = this.selSingleSource.value;
//    let multiSource = this.get_selected_options(this.selMultiSource);
    let drc = this.cmbDrc.value;
    let startTs = this.txtStartTs.value;
    let endTs = this.txtEndTs.value;
    
    console.log(drc, startTs, endTs);

    let data = {drc: drc, start: startTs, end: endTs};
    if (this.inputChangeCallback) this.inputChangeCallback(data);
}

HomeInputHandler.prototype.defineCallBack = function(callback) {
    this.inputChangeCallback = callback;
}

HomeInputHandler.prototype.fillDRCs = function(data)
{
    console.log('HomeInputHandler::fillDRCs', data);
    for (let drc of data) {
        let opt = document.createElement('option');
        opt.value = drc;
        opt.innerHTML = drc;
        this.cmbDrc.appendChild(opt);
    }
}