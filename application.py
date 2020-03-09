#region: import libraries and other setup
import os
import time

from flask import Flask, render_template, request, session
# from flask_session import Session
from flask_socketio import SocketIO, send, emit, join_room, leave_room, rooms

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Configure session to use filesystem
# app.config["SESSION_PERMANENT"] = False
# app.config["SESSION_TYPE"] = "filesystem"
# Session(app)

#endregion

#region: variables
all_rooms = [] # this list keeps all rooms on the server
current_room = ''

#endregion

#region: route events
@app.route("/")
def index():
    if session.get('session_current_room') is None:
        print (f"\n\n NO current room, session variable is {session.get('session_current_room')}\n")
        return render_template("index.html", all_rooms=all_rooms)
    
    current_room = session.get('session_current_room')
    print (f"\n\n current room {current_room} \n\n")
    return render_template("index.html", all_rooms=all_rooms, current_room=current_room)

#endregion

#region: socketio events

@socketio.on("add room") # when a user sends an "add room" event
def add_room (data):
    all_rooms.append (data["new_room_name"])
    emit("all rooms", all_rooms, broadcast=True)

@socketio.on('join') # when a user joins a room
def join (data):
    
    print (f"\n\n session variable is {session.get('session_current_room')}\n\n")

    # save room into current_room session for this user 
    session['session_current_room'] = data["room"]
    
    current_room = session.get('session_current_room')

    join_room(data["room"])

    send({"msg":data["username"] + " has joined the -" + data["room"] + "- channel."}, 
    room=data["room"])
    print (f"\n\n Socket Event - Join {data, current_room} \n\n")

    emit('switch_room', current_room)

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
    # Set timestamp
    time_stamp = time.strftime('%b-%d %I:%M%p', time.localtime())
    send({"username": username, "msg": msg, "time_stamp": time_stamp}, room=room)

#endregion

#region: new way of initialization: need to learn how to use
if __name__ == '__main__':
    socketio.run(app, debug=True)
#endregion