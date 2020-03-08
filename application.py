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
rooms = [] # this list keeps all rooms on the server
#endregion

#region: route events
@app.route("/")
def index():
    return render_template("index.html", rooms=rooms)
#endregion

#region: socketio events

@socketio.on("add room") # when a user sends an "add room" event
def add_room (data):
    rooms.append (data["new_room_name"])
    emit("all rooms", rooms, broadcast=True)

@socketio.on('join') # when a user joins a room
def join (data):
    
    join_room(data["room"])
    print (f"\n\n Socket Event - Join {data} \n\n")
    send({"msg":data["username"] + " has joined the -" + data["room"] + "- channel."}, 
    room=data["room"])

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