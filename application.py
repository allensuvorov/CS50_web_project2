#region: import libraries and other setup
import os
import time, random

from flask import Flask, render_template
from flask_socketio import SocketIO, send, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

#endregion

#region: variables
all_messages = [] # list of lists with dictionaries (messages) on the server
all_rooms = [] # list with all rooms on the server
room_messages = [] # list with messages from a specific room
dict_message = {} # dictionary with one message data

#endregion

#region: route events
@app.route("/")
def index():
    return render_template("index.html", all_rooms=all_rooms)

#endregion

#region: socketio events

@socketio.on("add room") # when a user sends an "add room" event
def add_room (data):
    all_rooms.append (data["new_room_name"])
    all_messages.append([]) # add an empty sub list
    emit("all rooms", all_rooms, broadcast=True)

@socketio.on('join') # when a user joins a room
def join (data):
    
    room = data["room"]
    if room in all_rooms:

        join_room(room) # join room function
        room_messages = all_messages[all_rooms.index(room)] # get messages from this room
        emit('switch room name', room) # send user new room name with event to show it on the page
        emit("room messages", room_messages) # send event with json passing up to 100 messages the user
        send({"msg":data["username"] + " has joined the -" + room + "- channel."}, room=room) # send all users in the room this notification of the join
        print(f'\n\n joined room - {room} \n\n') # print to console this message with room

@socketio.on('leave')
def leave(data):

    leave_room(data['room'])
    send({'msg':data['username'] + " has left the -" + data['room'] + "- channel."}, room=data['room'])

@socketio.on('delete_message')
def delete(data):
    
    dict_message = data["message"]
    room = data["room"]
    room_messages = all_messages[all_rooms.index(room)] # get list of messages from that room
    i = room_messages.index(dict_message) # search list and find index of the message 
    print(f'\n\n deleted messages index - {dict_message, i} \n\n') # for debugging
    all_messages[all_rooms.index(room)].pop(i) # remove the message
    emit('delete message', dict_message, room = room) # send event to all users in the room to delete the message
    
@socketio.on('new_message')
def message(data):
    """Broadcast messages"""

    msg = data["msg"]
    username = data["username"]
    room = data["room"]
    time_stamp = time.strftime('%b-%d %I:%M:%S %p', time.localtime()) # Set timestamp
    msg_id = random.randint(1,1000000) # generate a random number to be a msg ID
    dict_message = {"username": username, "msg": msg, "time_stamp": time_stamp, "msg_id": msg_id} # Dictionary with message data
    
    # check if server already has 100 msgs for this room and remove the earliest one
    if len(all_messages[all_rooms.index(room)]) == 100:
        all_messages[all_rooms.index(room)].pop(0)
    
    all_messages[all_rooms.index(room)].append(dict_message) # add message to sub list (the room)
    print(f'\n\n all messages - {room, all_messages, len(all_messages[all_rooms.index(room)])} \n\n') # for debugging - print to console this messate with room
    send(dict_message, room=room) # send message

#endregion

#region: new way of initialization: need to learn how to use
if __name__ == '__main__':
    socketio.run(app, debug=True)
#endregion