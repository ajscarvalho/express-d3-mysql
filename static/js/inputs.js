'use strict';

var version = "1.0.0";

var HomeInputHandler = function() { this.init(); }


HomeInputHandler.prototype.init = function(){
    //this.chartSizes      = document.getElementsByClassName('chart-size');//document.getElementById('rad_size');
    //this.selSingleSource = document.getElementById('sel_single-source');
    //this.selMultiSource  = document.getElementById('sel_multi-source');
    this.cmbDrc         = document.getElementById('pq_drc');
    this.txtStartDate   = document.getElementById('pq_startDate');
    this.txtStartTime   = document.getElementById('pq_startTime');
    this.txtEndDate     = document.getElementById('pq_endDate');
    this.txtEndTime     = document.getElementById('pq_endTime');
    this.btnApply       = document.getElementById('pq_apply');

    this.txtStartDate.addEventListener("change", this.dateFormat.bind(this, this.txtStartDate));
    this.txtEndDate  .addEventListener("change", this.dateFormat.bind(this, this.txtEndDate));

    this.btnApply.addEventListener('click', this.apply.bind(this));// , capture?: boolean)

    this.inputChangeCallback = null;
    this.dateFormat(this.txtStartDate);
    this.dateFormat(this.txtEndDate);
}

HomeInputHandler.prototype.dateFormat = function(domInput) {
    console.log('date', domInput, domInput.value);
    domInput.setAttribute(
        "data-date",
        domInput.value // just use the YYYY-MM-DD format
    );
};

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
    let startDate = this.txtStartDate.value;
    let startTime = this.txtStartTime.value;
    let endDate   = this.txtEndDate.value;
    let endTime   = this.txtEndTime.value;
    
    console.log(drc, startDate, startTime, endDate, endTime);

    let startTs = startDate + ' ' + startTime;
    let   endTs =   endDate + ' ' +   endTime;


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