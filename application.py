import os
import time

from flask import Flask, render_template
from flask_socketio import SocketIO, send, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# this list keeps all channels on the server
channels = []

@app.route("/")
def index():
    return render_template("index.html", channels=channels)

# when a user sends an "add channel" event
@socketio.on("add channel")
def add_channel (data):
    channels.append (data["new_channel_name"])
    emit("all channels", channels, broadcast=True)

# educational event handlers
# @socketio.on ('message')
# def message(data):

#     print (f"\n\n{data}\n\n")

#     send(data)


# these are under development
@socketio.on('join')
def on_join (data):
    
    join_room(data["room"])
    
    print (f"\n\n Socket Event - Join {data} \n\n")

    send({"msg":data["username"] + " has joined the " + data["room"] + " channel."}, 
    room=data["room"])

# @socketio.on('leave')
# def leave(data):

#     leave_room(data['room'])
#     send({'msg':data['username'] + " has left the " + data['room'] + "channel."}, room=data['room'])

@socketio.on('new_message')
def on_message(data):
    """Broadcast messages"""

    msg = data["msg"]
    username = data["username"]
    room = data["room"]
    # Set timestamp
    time_stamp = time.strftime('%b-%d %I:%M%p', time.localtime())
    send({"username": username, "msg": msg, "time_stamp": time_stamp}, room=room)

    # send({"username": username, "msg": msg, "time_stamp": time_stamp}, room=room)

# "time_stamp": time_stamp


# new way of initialization: need to learn how to use
if __name__ == '__main__':
    socketio.run(app, debug=True)