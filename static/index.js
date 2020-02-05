document.addEventListener('DOMContentLoaded', () => {
    let room;
    let username;
    { // Display Name Block Start 
    
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
    } // Display Name Block End
    
    { // WebSocket Block Start
        
        // Connect to websocket
        var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

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
        
        // Function for emitting channel joining event
        function join_channel () {
            // alert("I hear this click");
            room = this.innerHTML;
            username = localStorage.getItem('display_name_holder');
            socket.emit('join', {'username': username, 'room': room}); 
        };

        // When user clicks on a channel
        document.querySelectorAll('.select-channel').forEach(li => {
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

    } // WebSocket Block End
});