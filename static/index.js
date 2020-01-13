document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('name')) 
        document.querySelector('h2').innerHTML = `Hello ${localStorage.getItem('name')}!`
    
    document.querySelector('#form').onsubmit = function() {
        localStorage.setItem('name', document.querySelector('#name').value);
        
        // Show Display name in h2 
        document.querySelector('h2').innerHTML = `Display Name ${localStorage.getItem('name')}!`;
        
        // Clear input field
        document.querySelector('#name').value = '';
        
        // Stops the page from reloading after submitting the form
        return false;
    };
});