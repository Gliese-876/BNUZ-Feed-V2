var version = 1;

function jsloader(arr, cb) {
    var head = document.getElementsByTagName('head')[0];

    var _load_index = 0;

    function onScriptLoad(node, e, url) {
        var readyRegExp = navigator.platform === 'PLaySTATION 3' ? /^complete$/ : /^(complete|loaded)$/
        if (e.type === 'load' || (readyRegExp.test((e.currentTarget || e.srcElement).readyState))) {
            head.removeChild(node);
            onCallback();
        }
    }

    function onCallback() {
        _load_index++;
        if (_load_index == arr.length) {
            cb();
        } else {
            load(arr[_load_index]);
        }
    }

    var isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]';

    function load(url) {
        var node = document.createElement('script');

        node.async = true;
        node.charset = 'utf-8';
        node.src = url + '?v=' + version;

        head.appendChild(node);
        if (node.attachEvent && !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) && !isOpera) {
            node.attachEvent('onreadystatechange', function (e) {
                onScriptLoad(node, e, url);
            });
        } else {
            node.addEventListener('load', function (e) {
                onScriptLoad(node, e, url);
            }, false);
        }
    }

    load(arr[_load_index]);
}
function loadCSS( url ){

    var link = document.createElement('link');

    link.rel = 'stylesheet';

    link.href = url;

    document.getElementsByTagName('head')[0].appendChild(link);

}

//define function
