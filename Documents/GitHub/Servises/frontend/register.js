
// Автовыбор роли из URL
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    if (role === 'client') {
        const clientBtn = document.getElementById('clientBtn');
        if (clientBtn) clientBtn.click();
    } else if (role === 'master') {
        const masterBtn = document.getElementById('masterBtn');
        if (masterBtn) masterBtn.click();
    }
});
