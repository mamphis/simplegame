"use strict";

Date.prototype.format = function (format) {
    return (this.getDay() < 10 ? '0' : '') + this.getDay() + '.' +
        ((this.getMonth() + 1) < 10 ? '0' : '') + (this.getMonth() + 1) + '.'
        + this.getFullYear() + ' ' +
        this.getHours() + ':' + this.getMinutes() + ':' + this.getSeconds();
};

(function (window) {

    let userName = document.getElementById('username');
    let login = document.getElementById('login');
    let loginArea = document.getElementById('logonArea');
    let messageArea = document.getElementById('messageArea');
    let messages = document.getElementById('messages');
    let msgIn = document.getElementById('msgIn');

    class Client {
        constructor() {
            this.socket = io();

            this.socket.on('servererror', (message) => {
                console.log(message.message);
            });

            this.socket.on('login', (message) => {
                console.log(`Client connected: ${message.name}[${message.id}]`);
                this.me = { name: message.name, id: message.id };

                loginArea.style.display = 'none';
                messageArea.style.display = 'block';
            });

            this.socket.on('disconnect', () => {
                console.log("Disconnected!");
            });

            this.socket.on('clientMessage', (message) => {
                console.log(message);
                this.addMessage(message.from, message.msg);
            });
        }

        login(name) {
            this.socket.emit('connected', { name: name });
        }

        sendMessage(message) {
            this.socket.emit('clientMessage', { from: this.me, msg: message });
            this.addMessage(this.me, message);
        }

        addMessage(from, message) {
            let align = 'left';
            let fromDiv = undefined;

            if (this.me.id == from.id) {
                align = 'right';
            } else {
                fromDiv = document.createElement('div');
                fromDiv.innerText = from.name;
                fromDiv.classList.add('messageFrom');
            }

            let messageDiv = document.createElement('div');
            messageDiv.classList.add('singleMessage');

            let datetimeDiv = document.createElement('div');
            datetimeDiv.innerText = new Date().format();
            datetimeDiv.style.cssFloat = align;
            datetimeDiv.classList.add('messageDate')

            let textDiv = document.createElement('div');
            textDiv.style.cssFloat = align;
            textDiv.style.textAlign = align;
            textDiv.innerText = message;
            textDiv.classList.add('messageText');

            if (fromDiv) {
                messageDiv.appendChild(fromDiv);
            }

            messageDiv.appendChild(textDiv);
            messageDiv.appendChild(datetimeDiv);

            messages.appendChild(messageDiv);
        }
    }

    let client = new Client();

    login.addEventListener('click', (elem, event) => {
        userName.classList.remove('error');
        if (userName.value != '') {
            client.login(userName.value);
        } else {
            userName.classList.add('error');
        }
    });

    msgIn.addEventListener('keydown', (keyboardEvent) => {
        if (keyboardEvent.keyCode == 13 && !keyboardEvent.shiftKey) {
            keyboardEvent.preventDefault();
            let msg = msgIn.value.trim();

            if (msg != '') {
                msgIn.value = '';
                client.sendMessage(msg);
            }
        }
    });
})(window);
