document.addEventListener('DOMContentLoaded', () => {
    //#region Variables
    let room;
    let username;

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    //#endregion
    
    //#region Display Name
    
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
    //#endregion Display Name
    
    //#region WebSocket Events and Functions
        
    //#region Client Events
    // When user submits new channel, take user input and send it with an event to server
    document.querySelector('#channel_form').onsubmit = () => {
        const new_channel_name = document.querySelector('#channel_input').value;
        socket.emit('add channel', {'new_channel_name': new_channel_name})
        
        // Stops the page from reloading after submitting the form
        return false;
    };

    // When user submits a message
    document.querySelector('#message_form').onsubmit = () => {
        const new_message = document.querySelector('#message_input').value;
        socket.emit('new_message', {'msg': new_message, 'username': username, 'room': room}); 
        return false;
    };
    
    // The bug starts here!
    // When user clicks on a channel
    document.querySelectorAll('.select-channel').forEach(li => {
        li.onclick = () =>{
            let selected_channel = li.innerHTML
            // Check if user already in the channel
            if (selected_channel === room) {
                msg = `You are already in the ${room} channel.`;
                printSysMsg(msg);
            } 
            else {
                leave_channel();
                join_channel();
                room = selected_channel;
            }
        };
    });
        //#endregion Client Events
        
    //#region Server Events

    // When a new channel is announced, add new channel to HTML
    socket.on('all channels', data => {            
        const li = document.createElement('li');
        
        // Get last channel from the array (list)
        li.innerHTML = data[data.length-1]; 
        
        li.setAttribute("class", "select-channel");
        document.querySelector('#channels').append(li);
        
        //dynamically created channel gets onclick handler
        li.onclick = join_channel;
        
    });

    // Display all incoming messages
    socket.on('message', data => {
        
        // Display current message
        if (data.msg) {
            const p = document.createElement('p');
            const span_username = document.createElement('span');
            const span_timestamp = document.createElement('span');
            const br = document.createElement('br')
            // Display user's own message
            if (data.username == username) {
                    
                // p.setAttribute("class", "my-msg");

                // Username
                // span_username.setAttribute("class", "my-username");
                span_username.innerText = data.username;

                // Timestamp
                // span_timestamp.setAttribute("class", "timestamp");
                span_timestamp.innerText = data.time_stamp;

                // HTML to append
                p.innerHTML += span_username.outerHTML + br.outerHTML + data.msg + br.outerHTML + span_timestamp.outerHTML

                //Append
                document.querySelector('#display-message-section').append(p);
            }
            // Display other users' messages
            else if (typeof data.username !== 'undefined') {
                // p.setAttribute("class", "others-msg");

                // Username
                // span_username.setAttribute("class", "other-username");
                span_username.innerText = data.username;

                // Timestamp
                span_timestamp.setAttribute("class", "timestamp");
                span_timestamp.innerText = data.time_stamp;

                // HTML to append
                p.innerHTML += span_username.outerHTML + br.outerHTML + data.msg + br.outerHTML + span_timestamp.outerHTML;

                //Append
                document.querySelector('#display-message-section').append(p);
            }
            // Display system message
            else {
                printSysMsg(data.msg);
            }
        }
        scrollDownChatWindow();

        // Autofocus on text box
        // document.querySelector("#message_input").focus();
    });
        //#endregion Server Events
        
    //#region Functions
    // Function for emitting join channel event
    function join_channel () {
        room = this.innerHTML;
        username = localStorage.getItem('display_name_holder');
        socket.emit('join', {'username': username, 'room': room}); 
    };

    // Function for emitting leave channel event
    function leave_channel () {
        // alert("I hear this click");
        // room = this.innerHTML;
        username = localStorage.getItem('display_name_holder');
        socket.emit('leave', {'username': username, 'room': room}); 
    };
    //#endregion Functions
    
    //#endregion WebSocket
    
    //#region Other Chat functions
    // Scroll chat window down
    function scrollDownChatWindow() {
        const chatWindow = document.querySelector("#display-message-section");
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Print system messages
    function printSysMsg(msg) {
        const p = document.createElement('p');
        // p.setAttribute("class", "system-msg");
        p.innerHTML = msg;
        document.querySelector('#display-message-section').append(p);
        scrollDownChatWindow()

        // Autofocus on text box
        document.querySelector("#message_input").focus();
    }
    //#endregion
});