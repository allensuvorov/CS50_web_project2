document.addEventListener('DOMContentLoaded', () => {
    let room;
    let username;
    
    // By default, submit button is disabled
    document.querySelector('#display_name_submit').disabled = true;

    // Enable button only if there is text in the input field
    document.querySelector('#display_name_input').onkeyup = () => {
        if (document.querySelector('#display_name_input').value.length > 0)
            document.querySelector('#display_name_submit').disabled = false;
        else
            document.querySelector('#display_name_submit').disabled = true;
    };
    
    // Previously saved display_name is displayed  
    if (localStorage.getItem('display_name_holder')) {
        document.querySelector('#display-name').innerHTML = localStorage.getItem('display_name_holder') 
    };

    // Adding or changing the display name 
    document.querySelector('#display_name_form').onsubmit = () => {
        // Take the new display name from user input and save it to the holder variable
        localStorage.setItem('display_name_holder', document.querySelector('#display_name_input').value);
        
        // Show the display name in h2 
        document.querySelector('#display-name').innerHTML = localStorage.getItem('display_name_holder');
        
        // Clear input field
        document.querySelector('#display_name_input').value = '';
        
        // Stops the page from reloading after submitting the form
        return false;
    };
    
    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // Adding channel: when connected, 
    socket.on('connect', () => {
    });

    // When user submits new channel, take user input and send it with an event to server
    document.querySelector('#channel_form').onsubmit = () => {
        const new_channel_name = document.querySelector('#channel_input').value;
        socket.emit('add channel', {'new_channel_name': new_channel_name})
        
        // Stops the page from reloading after submitting the form
        return false;
    };
    
    // When a new channel is announced, add new channel to HTML
    socket.on('all channels', data => {            
        const li = document.createElement('li');
        li.innerHTML = data[data.length-1]; // Get last channel from the array (list)
        document.querySelector('#channels').append(li);
    });
    
    // When user clicks on a channel
    document.querySelectorAll('.select-channel').forEach(a => {
        a.onclick = () => {
            
            // Debugging tool
            alert("I hear this click");
            
            room = a.innerHTML;
            username = localStorage.getItem('display_name_holder');
            socket.emit('join', {'username': username, 'room': room}); 
        };
        
    });
    // Display all incoming messages
    socket.on('message', data => {
        alert ('the server sent the message about new user in the channel');
        const p = document.createElement('p');
        // HTML to append
        p.innerHTML = data.msg;
        // Append
        document.querySelector('#display-message-section').append(p);
    });
        
});