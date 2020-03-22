document.addEventListener('DOMContentLoaded', () => {
    //#region Variables
    let room = localStorage.getItem('room_name_holder');
    console.log(`room = ${room}`);
    let username = localStorage.getItem('display_name_holder');
    let message = {};
    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    //#endregion
    
    //#region Page Settings On-Load
    
    // By default, submit button is disabled
    document.querySelector('#display_name_submit').disabled = true; // display name
    document.querySelector('#room_submit').disabled = true; // new room
    
    // Previously saved display_name is displayed  
    if (username) document.querySelector('#display-name').innerHTML = username;

    // User is brought back to the room where they were
    if (room) {
        let room_exists = false;
        // check if user past channel is still among channels on server
        document.querySelectorAll('.select-room').forEach(li => {
            if (li.innerHTML == room) room_exists = true;
        });
        
        if (room_exists) {
            console.log ('room exists')
            join_room(room);
        } else { 
            console.log ('room is not longer on server');
            localStorage.removeItem('room_name_holder');
            room = "";
            console.log (localStorage.getItem('room_name_holder'));

        }
    };
    //#endregion Page Settings On-Load
        
    //#region Client Event Handlers

    // Enable button only if there is text in the input field
    document.querySelector('#display_name_input').onkeyup = () => {
        if (document.querySelector('#display_name_input').value.length > 0)
            document.querySelector('#display_name_submit').disabled = false;
        else
            document.querySelector('#display_name_submit').disabled = true;
    };
    
    // Check room input field
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
        username = localStorage.getItem('display_name_holder')

        // Show the display name in h2 
        document.querySelector('#display-name').innerHTML = username;
        
        // Clear input field
        document.querySelector('#display_name_input').value = '';
        
        // Stops the page from reloading after submitting the form
        return false;
    };

    
    // When user submits new room, take user input and send it with an event to server
    document.querySelector('#room_form').onsubmit = () => {
        const new_room_name = document.querySelector('#room_input').value;
        let unique_room_name = true;
        // check if user input channel name is already among channels
        document.querySelectorAll('.select-room').forEach(li => {
            if (li.innerHTML == new_room_name) unique_room_name = false;
        });
        
        if (!unique_room_name) {
            alert (`Channel -${new_room_name}- already exists! `)
        } else {
            socket.emit('add room', {'new_room_name': new_room_name})
            // Clear input field
            document.querySelector('#room_input').value = '';
        };

        // Stops the page from reloading after submitting the form
        return false;
    };

    // When user submits a message
    document.querySelector('#message_form').onsubmit = () => {
        const new_message = document.querySelector('#message_input').value;
        socket.emit('new_message', {'msg': new_message, 'username': username, 'room': room});
        // Clear input field
        document.querySelector('#message_input').value = '';
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

    // switch room name on user page
    socket.on('switch room name', data =>{
        //  alert(data);
        document.querySelector('#current-room').innerHTML = data;
    });

    // send message history of the room to user
    socket.on('room messages', data =>{
        // alert(JSON.stringify(data));
        data.forEach (printUserMsg);
    });

    // Display all incoming messages
    socket.on('message', data => {
        
        // Display current message, check if there is a message
        if (data.msg) {
            
            // Display all users message
            if (typeof data.username !== 'undefined') {
                printUserMsg(data)
            }
            // Display system message
            else {
                printSysMsg(data.msg);
            }
        }
        // scrollDownChatWindow();

        // Autofocus on text box
        // document.querySelector("#message_input").focus();
    });

    // Delete selected message 
    socket.on('delete message', data => {
        console.log("#" + data.msg_id);
        document.querySelector ("#" + CSS.escape(data.msg_id)).remove();

        // document.querySelector (`#${data.msg_id}`).remove();
    });
    //#endregion Server WebSocket Events
        
    //#region Functions
    
    // Print all users messages
    function printUserMsg (data) {

        console.log(data.msg);

        const p = document.createElement('p');
        const span_username = document.createElement('span');
        const span_timestamp = document.createElement('span');
        const br = document.createElement('br')

        p.setAttribute("id", data.msg_id);
        
        // Username
        // span_username.setAttribute("class", "my-username");
        span_username.innerText = data.username;
        
        // Timestamp
        // span_timestamp.setAttribute("class", "timestamp");
        span_timestamp.innerText = data.time_stamp;
        
        // HTML to append
        p.innerHTML += span_username.outerHTML + br.outerHTML + data.msg + br.outerHTML + span_timestamp.outerHTML
        
        // For user own message add button to hide message.
        if (data.username == username) {
            const hide = document.createElement('button');
            hide.className = 'hide';
            hide.innerHTML = 'Hide';
            p.append(hide);
        
            // When hide button is clicked, send even to server to delete message.
            hide.onclick = () => {socket.emit('delete_message',{'message':data,'room':room})};
                // console.log(data);
                // this.parentElement.remove();
        }
        //Append
        document.querySelector('#display-message-section').append(p);
    };

    // Switch Room function
    function switch_room () {
        let new_selected_room = this.innerHTML;
        //alert(selected_room);
        // Check if user already in the room
        if (new_selected_room === room) {
            console.log(`new selected room = ${new_selected_room}`)
            console.log(`room = ${room}`)
            msg = `You are already in the ${room} channel.`;
            printSysMsg(msg); 
        } else {
            if (room) leave_room(room);
            join_room(new_selected_room);
            room = new_selected_room;
            localStorage.setItem('room_name_holder', room);
            // alert (`you have joined ${room}`);
        }
    };

    // Function for emitting join room event
    function join_room (room) {
        socket.emit('join', {'username': username, 'room': room});

        // Clear message area
        document.querySelector('#display-message-section').innerHTML = '';
    };

    // Function for emitting leave room event
    function leave_room (room) {
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