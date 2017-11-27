'use strict';

var version = "1.0.0";

var TabHandler = function() { this.init(); }


TabHandler.prototype.init = function(){
    this.nav = document.getElementById('MainNav');
    this.tabs = this.nav.getElementsByClassName('TabTrigger');
    for (let tab of this.tabs){
        tab.addEventListener('click', this.tab_click.bind(this, tab));
    }
}

TabHandler.prototype.tab_click = function(selectedTab) {
    this.hide_contents();
    this.show_tab(selectedTab);
}

TabHandler.prototype.hide_contents = function() {
    for (let tab of this.tabs){
        tab.parentNode.className = '';
    
        let targetId = tab.getAttribute('data-target');
        let target = document.getElementById(targetId);
        target.style.display = 'none';
    }
}

TabHandler.prototype.show_tab = function(tab) {
    tab.parentNode.className = 'selected';

    let targetId = tab.getAttribute('data-target');
    let target = document.getElementById(targetId);
    target.style.display = 'block';
}