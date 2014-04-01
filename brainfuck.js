(function(global) {
    'use strict';

    (function(id) {
        var i, j;
        var tab = document.getElementById(id);
        var thead = tab.querySelector('thead');
        var tbody = tab.querySelector('tbody');
        var tr, th, td;
        // tr = document.createElement('tr');
        // th = document.createElement('td');
        // tr.appendChild(th);
        // for (i = 0; i < 30; i++) {
        //     th = document.createElement('th');
        //     th.textContent = i + 1;
        //     tr.appendChild(th);
        // }
        // thead.appendChild(tr);
        for (i = 0; i < 3; i++) {
            tr = document.createElement('tr');
            // th = document.createElement('th');
            // th.textContent = i + 1;
            // tr.appendChild(th);
            for (j = 0; j < 30; j++) {
                td = document.createElement('td');
                td.textContent = 0;
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
    })('rams');


})(this)
