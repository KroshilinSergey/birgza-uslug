(function() {
    var correctHost = 'xn----7sbckmly0bmtc.xn--p1ai';
    var currentHost = window.location.hostname;
    
    // Если текущий хост не совпадает с правильным и не кириллический вариант
    if (currentHost !== correctHost && currentHost !== 'биржа-услуг.рф') {
        // Если это не localhost и не IP
        if (!currentHost.includes('localhost') && !currentHost.match(/^\d+\.\d+\.\d+\.\d+$/)) {
            localStorage.clear();
            window.location.href = 'https://' + correctHost + window.location.pathname + window.location.search;
        }
    }
})();
