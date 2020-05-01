console.log('new user array');
let users = [];

function addUser(socketId, id, username, room) {
    const newUser = { socketId, id, username, room };
    users.push(newUser);
    return newUser;
}

function getUser(socketId) {
    return users.find(user => user.socketId === socketId);
}

function getUserByUsername(username) {
    return users.find(user => user.username === username);
}

function removeUser(socketId) {
    const index = users.findIndex(user => user.socketId === socketId);
    if(index !== '-1') users.splice(index, 1);
}

module.exports = {
    addUser,
    getUser,
    getUserByUsername,
    removeUser
};