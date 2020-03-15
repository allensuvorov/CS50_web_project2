#region: import libraries and other setup
import os
import time

from flask import Flask, render_template
from flask_socketio import SocketIO, send, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

#endregion

#region: variables
all_rooms = [] # this list keeps all rooms on the server
all_messages = [] # this list of lists of dictionaries keeps all messages on the server
room_messages = [] # list with messages from a specific room
dict_message = {}

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

    join_room(data["room"]) # join room function
    
    # get messages from this room
    room_messages = all_messages[all_rooms.index(data["room"])]
    
    # send event with json passing 100 messages the user
    emit("room messages", room_messages)

    send({"msg":data["username"] + " has joined the -" + data["room"] + "- channel."}, 
    room=data["room"]) # send all users in the this notification of the join
    emit('switch room name', data["room"]) # send user new room name with event to show it on the page
    print(f'\n\n joined room - {data["room"], all_messages, room_messages} \n\n') # print to console this message with room


@socketio.on('leave')
def leave(data):

    leave_room(data['room'])
    send({'msg':data['username'] + " has left the -" + data['room'] + "- channel."}, room=data['room'])

@socketio.on('new_message')
def message(data):
    """Broadcast messages"""

    msg = data["msg"]
    username = data["username"]
    room = data["room"]
    time_stamp = time.strftime('%b-%d %I:%M%p', time.localtime()) # Set timestamp
    
    dict_message = {"username": username, "msg": msg, "time_stamp": time_stamp}
    if len(all_messages[all_rooms.index(room)]) <= 100:
        all_messages[all_rooms.index(room)].append(dict_message) # add message to sub list
    # all_messages.append(dict_message) # add message to sub list

    print(f'\n\n all messages - {data["room"], all_messages, len(all_messages[all_rooms.index(room)])} \n\n') # print to console this messate with room

    send(dict_message, room=room)

#endregion

#region: new way of initialization: need to learn how to use
if __name__ == '__main__':
    socketio.run(app, debug=True)
#endregion