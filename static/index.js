document.addEventListener('DOMContentLoaded', () => {
    //#region Variables
    let room = localStorage.getItem('room_name_holder');
    let username;
    
    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    //#endregion
    
    //#region Page Settings On-Load Display
    
    // By default, submit button is disabled
    document.querySelector('#display_name_submit').disabled = true; // display name
    document.querySelector('#room_submit').disabled = true; // new room
    
    // Previously saved display_name is displayed  
    if (localStorage.getItem('display_name_holder')) {
        document.querySelector('#display-name').innerHTML = localStorage.getItem('display_name_holder') 
    };

    // User is brought back to the room where they were
    if (room) join_room(room);
    
    socket.on('connect', () => { 
    });

    //#endregion Page Settings On-Load Display
        
    //#region Client Event Handlers

    // Enable button only if there is text in the input field
    document.querySelector('#display_name_input').onkeyup = () => {
        if (document.querySelector('#display_name_input').value.length > 0)
            document.querySelector('#display_name_submit').disabled = false;
        else
            document.querySelector('#display_name_submit').disabled = true;
    };
    
    //
    document.querySelector('#room_input').onkeyup = () => {

        if (document.querySelector('#room_input').value.length > 0) {
            document.querySelector('#room_submit').disabled = false;
            
            // check if user input channel name is already among channels
            document.querySelectorAll('.select-room').forEach(li => {
                if (li.innerHTML == document.querySelector('#room_input').value) {
                    document.querySelector('#room_submit').disabled = true;
                };
            });
        } else {
            document.querySelector('#room_submit').disabled = true;
        };
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

    
    // When user submits new room, take user input and send it with an event to server
    document.querySelector('#room_form').onsubmit = () => {
        const new_room_name = document.querySelector('#room_input').value;
        socket.emit('add room', {'new_room_name': new_room_name})
        
        // Clear input field
        document.querySelector('#room_input').value = '';

        // Stops the page from reloading after submitting the form
        return false;
    };

    // When user submits a message
    document.querySelector('#message_form').onsubmit = () => {
        const new_message = document.querySelector('#message_input').value;
        socket.emit('new_message', {'msg': new_message, 'username': username, 'room': room}); 
        return false;
    };
    
    // When user clicks on a room
    document.querySelectorAll('.select-room').forEach(li => {
        li.onclick = switch_room;
    });
    //#endregion Client Events
        
    //#region Server WebSocket Event Handlers

    

    // When a new room is announced, add new room to HTML
    socket.on('all rooms', data => {            
        const li = document.createElement('li');
        
        // Get last room from the array (list)
        li.innerHTML = data[data.length-1]; 
        
        li.setAttribute("class", "select-room");
        document.querySelector('#rooms').append(li);
        
        //dynamically created room gets onclick handler
        li.onclick = switch_room;
        
    });

    // When switch room
    socket.on('switch_room_name', data =>{
        //  alert(data);
        document.querySelector('#current-room').innerHTML = data;
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
    //#endregion Server WebSocket Events
        
    //#region Functions
    // Switch Room function
    function switch_room () {
        let new_selected_room = this.innerHTML;
        //alert(selected_room);
        // Check if user already in the room
        if (new_selected_room === room) {
            msg = `You are already in the ${room} channel.`;
                printSysMsg(msg);
            } 
            else {
                leave_room(room);
                join_room(new_selected_room);
                room = new_selected_room;
                localStorage.setItem('room_name_holder', room);
                // alert (`you have joined ${room}`);
        }
    };

    // Function for emitting join room event
    function join_room (room) {
        username = localStorage.getItem('display_name_holder');
        socket.emit('join', {'username': username, 'room': room}); 
    };

    // Function for emitting leave room event
    function leave_room (room) {
        // alert("I hear this click");
        // room = this.innerHTML;
        username = localStorage.getItem('display_name_holder');
        socket.emit('leave', {'username': username, 'room': room}); 
    };

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